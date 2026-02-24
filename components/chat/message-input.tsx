"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, X, Image, Video, Mic, Paperclip, FileText } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";

interface MessageInputProps {
  conversationId: Id<"conversations">;
  replyingTo?: Id<"messages"> | null;
  onClearReply?: () => void;
}

export function MessageInput({ conversationId, replyingTo, onClearReply }: MessageInputProps) {
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const sendMessage = useMutation(api.messages.send);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const setTyping = useMutation(api.typing.setTyping);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  
  // Check online status
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);
  
  // Get the message being replied to
  const repliedMessage = useQuery(
    api.messages.get,
    replyingTo ? { messageId: replyingTo, clerkId: user?.id } : "skip"
  );

  const handleSend = async () => {
    if ((!content.trim() && !selectedFile) || isSending) return;

    // Check if offline
    if (!isOnline) {
      toast.error("You are offline. Please check your connection and try again.", {
        icon: "⚠️",
        duration: 4000,
      });
      return;
    }

    const messageContent = content.trim();
    setContent("");

    // If online, try to send
    setIsSending(true);
    try {
      let fileId: Id<"_storage"> | undefined;
      let fileUrl: string | undefined;
      let messageType: "text" | "image" | "video" | "audio" | "document" = "text";
      let fileName: string | undefined;
      let fileSize: number | undefined;
      let duration: number | undefined;

      // Handle file upload
      if (selectedFile) {
        // Determine message type based on file
        if (selectedFile.type.startsWith("image/")) {
          messageType = "image";
        } else if (selectedFile.type.startsWith("video/")) {
          messageType = "video";
        } else if (selectedFile.type.startsWith("audio/")) {
          messageType = "audio";
          duration = recordingTime;
        } else {
          // Default to document for other file types (PDF, Word, Excel, etc.)
          messageType = "document";
        }

        fileName = selectedFile.name;
        fileSize = selectedFile.size;

        // Generate upload URL and upload file
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedFile.type },
          body: selectedFile,
        });
        const { storageId } = await result.json();
        fileId = storageId;
        // Get file URL using the query
        // Note: We'll get the URL on the client side when displaying
        // For now, we'll store the fileId and retrieve the URL when needed
      }

      await sendMessage({
        conversationId,
        content: messageContent || (messageType !== "text" ? `${messageType} message` : ""),
        messageType,
        fileId,
        fileName,
        fileSize,
        fileUrl,
        duration,
        clerkId: user?.id,
        replyTo: replyingTo || undefined,
      });
      
      setSelectedFile(null);
      if (onClearReply) {
        onClearReply();
      }
      await setTyping({ conversationId, isTyping: false, clerkId: user?.id });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.", {
        icon: "❌",
        duration: 3000,
      });
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);

    // Set typing indicator
    if (e.target.value.trim()) {
      setTyping({ conversationId, isTyping: true, clerkId: user?.id });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setTyping({ conversationId, isTyping: false, clerkId: user?.id });
      }, 2000);
    } else {
      setTyping({ conversationId, isTyping: false, clerkId: user?.id });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        setSelectedFile(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      setTyping({ conversationId, isTyping: false, clerkId: user?.id });
    };
  }, [conversationId, setTyping, user, isRecording]);

  return (
    <div className="border-t bg-gradient-to-t from-card via-card to-card/95 dark:from-[#0d1519] dark:via-[#111B21] dark:to-[#111B21] backdrop-blur-sm shadow-lg">
      {replyingTo && repliedMessage && (
        <div className="flex items-center justify-between border-b border-border/50 bg-primary/5 dark:bg-primary/10 px-4 py-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary mb-0.5">Replying to {repliedMessage.senderName}</p>
            <p className="text-sm truncate text-muted-foreground">{repliedMessage.content}</p>
          </div>
          {onClearReply && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 hover:bg-primary/10 transition-colors"
              onClick={onClearReply}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      {selectedFile && (
        <div className="flex items-center justify-between border-b border-border/50 bg-primary/5 dark:bg-primary/10 px-4 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {selectedFile.type.startsWith("image/") && <Image className="h-4 w-4 text-primary shrink-0" />}
            {selectedFile.type.startsWith("video/") && <Video className="h-4 w-4 text-primary shrink-0" />}
            {selectedFile.type.startsWith("audio/") && <Mic className="h-4 w-4 text-primary shrink-0" />}
            {!selectedFile.type.startsWith("image/") && !selectedFile.type.startsWith("video/") && !selectedFile.type.startsWith("audio/") && <FileText className="h-4 w-4 text-primary shrink-0" />}
            <span className="text-sm truncate font-medium">{selectedFile.name}</span>
            {!selectedFile.type.startsWith("audio/") && selectedFile.size && (
              <span className="text-xs text-muted-foreground shrink-0">
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            )}
            {selectedFile.type.startsWith("audio/") && recordingTime > 0 && (
              <span className="text-xs text-muted-foreground shrink-0">({formatTime(recordingTime)})</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 hover:bg-primary/10 transition-colors"
            onClick={() => setSelectedFile(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="flex gap-2 p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || isRecording}
            title="Attach file"
            className="h-10 w-10 hover:bg-primary/10 transition-colors"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isSending || !!selectedFile}
            className={`h-10 w-10 transition-colors ${
              isRecording 
                ? "text-destructive hover:bg-destructive/10 animate-pulse" 
                : "hover:bg-primary/10"
            }`}
            title={isRecording ? "Stop recording" : "Record voice"}
          >
            <Mic className="h-4 w-4" />
          </Button>
          {isRecording && (
            <div className="flex items-center px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
              <div className="h-2 w-2 rounded-full bg-destructive animate-pulse mr-2" />
              {formatTime(recordingTime)}
            </div>
          )}
        </div>
        <Input
          ref={inputRef}
          placeholder={replyingTo ? "Type a reply..." : "Type a message..."}
          value={content}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          disabled={isSending || isRecording}
          className="flex-1 h-10 rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <Button
          onClick={handleSend}
          disabled={(!content.trim() && !selectedFile) || isSending || isRecording}
          size="icon"
          className="h-10 w-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
