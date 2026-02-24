"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatMessageTime } from "@/lib/utils";
import { Trash2, Smile, Check, CheckCheck, Play, Download, FileText } from "lucide-react";
import { useState, useRef } from "react";
import { MessageReactions } from "./message-reactions";
import { useUser } from "@clerk/nextjs";
import { DeleteMessageDialog } from "./delete-message-dialog";

interface MessageItemProps {
  message: any;
  currentUserId: Id<"users">;
  onReply?: (messageId: Id<"messages">) => void;
  isGroup?: boolean;
  isOtherUserOnline?: boolean;
}

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

export function MessageItem({ message, currentUserId, onReply, isGroup = false, isOtherUserOnline = false }: MessageItemProps) {
  const { user } = useUser();
  const sender = useQuery(
    api.users.get,
    message.senderId ? { userId: message.senderId } : "skip"
  );
  const fileUrl = useQuery(
    api.files.getFileUrl,
    message.fileId ? { fileId: message.fileId } : "skip"
  );
  // Use fileUrl from query if available, otherwise use message.fileUrl
  const mediaUrl = fileUrl || message.fileUrl;
  // Fetch replied message if replyTo exists and we don't already have repliedMessage data
  const repliedMessageData = useQuery(
    api.messages.get,
    message.replyTo && !message.repliedMessage ? { messageId: message.replyTo, clerkId: user?.id } : "skip"
  );
  
  // Use existing repliedMessage or fetch it
  const repliedMessage = message.repliedMessage || (repliedMessageData ? {
    _id: repliedMessageData._id,
    content: repliedMessageData.content,
    senderName: repliedMessageData.senderName,
    isDeleted: repliedMessageData.isDeleted,
  } : null);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const [showReactions, setShowReactions] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const isOwnMessage = message.senderId === currentUserId;
  const isDeleted = message.isDeleted;
  
  // Determine tick status for own messages
  const getTickStatus = () => {
    // Only show ticks for own messages
    if (!isOwnMessage) {
      return null;
    }
    
    // Groups always show single tick (grey) only
    if (isGroup) {
      return 'sent';
    }
    
    // Individual chats only:
    // Priority 1: Check if message has been read (double ticks)
    if (message.isRead === true) {
      return 'read';
    }
    
    // Priority 2: Check if other user is online (double grey ticks - delivered)
    if (isOtherUserOnline === true) {
      return 'delivered'; // Double grey ticks
    }
    
    // Priority 3: Default - message sent (single grey tick)
    return 'sent'; // Single grey tick
  };
  
  const tickStatus = getTickStatus();

  const handleDelete = async () => {
    try {
      await deleteMessage({ messageId: message._id, clerkId: user?.id });
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDeleted) return;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStartPos.current || isDeleted) return;
    const deltaX = Math.abs(e.clientX - dragStartPos.current.x);
    const deltaY = Math.abs(e.clientY - dragStartPos.current.y);
    
    // If dragged more than 10px, consider it a drag
    if (deltaX > 10 || deltaY > 10) {
      setIsDragging(true);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!dragStartPos.current || isDeleted) return;
    
    const deltaX = Math.abs(e.clientX - dragStartPos.current.x);
    const deltaY = Math.abs(e.clientY - dragStartPos.current.y);
    
    // If dragged significantly (like WhatsApp swipe to reply)
    if ((deltaX > 50 || deltaY > 30) && isDragging && onReply) {
      onReply(message._id);
    }
    
    dragStartPos.current = null;
    setIsDragging(false);
  };

  // Determine if we should show sender name and avatar
  // ONLY show in group chats, NEVER in individual chats (even for deleted messages)
  // For deleted messages in individual chats, name is shown inside the bubble only
  const shouldShowSenderInfo = isGroup && !isDeleted;
  const senderName = sender?.name || message.senderName || "Unknown";

  // For deleted messages, we can show them even if sender hasn't loaded yet (we have senderName from backend)
  // For regular messages, we need sender to be loaded
  if (!sender && !isDeleted && !message.senderName) {
    return null;
  }

  return (
    <div
      className={`group flex gap-2 ${
        isOwnMessage ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Show avatar ONLY in group chats for regular messages, NEVER in individual chats */}
      {!isOwnMessage && sender && isGroup && (
        <Avatar
          src={sender.imageUrl}
          alt={senderName}
          fallback={senderName.charAt(0).toUpperCase()}
          className="h-7 w-7 shrink-0 mt-1"
        />
      )}
      <div
        className={`relative flex flex-col gap-0.5 max-w-[75%] sm:max-w-[400px] overflow-visible ${
          isOwnMessage ? "items-end" : "items-start"
        }`}
      >
        {/* Only show sender name above message in group chats, NEVER in individual chats */}
        {isGroup  && (
          <p className="text-xs font-medium text-muted-foreground px-1">
            {isOwnMessage ? "You" : senderName}
          </p>
        )}
        {/* Reaction picker on click - absolute positioned below message, overlapping */}
        {!isDeleted && showReactions && (
          <div className={`absolute top-full -mt-3 z-50 ${isOwnMessage ? 'right-0' : 'left-0'} max-w-[calc(100vw-2rem)]`}>
            <MessageReactions
              messageId={message._id}
              currentReactions={message.reactions || {}}
              userReactions={message.userReactions || []}
              onClose={() => setShowReactions(false)}
            />
          </div>
        )}
        <div 
          ref={messageRef}
          className={`flex items-end gap-1.5 w-full ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} ${isDragging ? 'opacity-50' : ''} ${!isDeleted ? 'cursor-move select-none' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            dragStartPos.current = null;
            setIsDragging(false);
          }}
        >
          <div
            className={`rounded-2xl px-4 py-2.5 min-w-0 max-w-full shadow-sm transition-all ${
              isOwnMessage
                ? "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-500 dark:to-gray-600 text-gray-900 dark:text-white"
                : "bg-gradient-to-br from-muted to-muted/80 dark:from-[#2A3942] dark:to-[#202C33] text-foreground dark:text-white"
            }`}
          >
            {isDeleted ? (
              <div className="space-y-1">
                <p className={`text-xs font-medium ${isOwnMessage ? 'text-gray-700 dark:text-white/80' : 'text-foreground/90 dark:text-white/80'}`}>
                  {isOwnMessage ? "You" : senderName} deleted this message
                </p>
                <p className={`italic text-sm ${isOwnMessage ? 'text-gray-600 dark:text-white/70' : 'text-foreground/80 dark:text-white/70'}`}>
                  This message was deleted
                </p>
              </div>
            ) : (
              <>
                {/* Reply preview */}
                {message.repliedMessage && !message.repliedMessage.isDeleted && (
                  <div className={`mb-1.5 border-l-2 pl-2 text-xs ${
                    isOwnMessage ? 'border-gray-400 text-gray-700 dark:border-white/30 dark:text-white/70' : 'border-foreground/30 dark:border-white/30 text-foreground/80 dark:text-white/70'
                  }`}>
                    <p className="font-medium">{message.repliedMessage.senderName || 'Unknown'}</p>
                    <p className="truncate">{message.repliedMessage.content || 'This message was deleted'}</p>
                  </div>
                )}
              <div className="space-y-2">
                {/* Media content */}
                {message.messageType === "image" && mediaUrl && (
                  <div className="rounded-lg overflow-hidden max-w-full">
                    <img
                      src={mediaUrl}
                      alt={message.content || "Image"}
                      className="max-w-full h-auto rounded-lg"
                      loading="lazy"
                    />
                  </div>
                )}
                {message.messageType === "video" && mediaUrl && (
                  <div className="rounded-lg overflow-hidden max-w-full">
                    <video
                      src={mediaUrl}
                      controls
                      className="max-w-full h-auto rounded-lg"
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
                {message.messageType === "audio" && mediaUrl && (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <audio src={mediaUrl} controls className="flex-1" />
                    {message.duration && (
                      <span className="text-xs text-muted-foreground">
                        {Math.floor(message.duration / 60)}:{(message.duration % 60).toString().padStart(2, "0")}
                      </span>
                    )}
                  </div>
                )}
                {message.messageType === "document" && mediaUrl && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                    <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{message.fileName || "Document"}</p>
                      {message.fileSize && (
                        <p className="text-xs text-muted-foreground">
                          {(message.fileSize / 1024).toFixed(1)} KB
                        </p>
                      )}
                    </div>
                    <a
                      href={mediaUrl}
                      download={message.fileName}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </div>
                )}
                {/* Text content with timestamp and ticks inline */}
                {message.content && (
                  <div className="mt-1">
                    <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere leading-relaxed">
                      {message.content}
                      <span className={`inline-flex  justify-end  right-0 bottom-0 items-end gap-1 ml-2 text-xs opacity-70 ${isOwnMessage ? 'text-gray-700 dark:text-white/80' : 'text-foreground/80 dark:text-white/80'}`}>
                        {formatMessageTime(message.createdAt)}
                        {isOwnMessage && (
                          <span className={`inline-flex items-center ${tickStatus === 'read' ? 'text-blue-400 dark:text-blue-400' : 'text-blue-400/70 dark:text-blue-400/70'}`}>
                            {tickStatus === 'sent' ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <CheckCheck className={`h-3.5 w-3.5 ${tickStatus === 'read' ? 'text-blue-400 dark:text-blue-400' : 'text-blue-400/70 dark:text-blue-400/70'}`} />
                            )}
                          </span>
                        )}
                      </span>
                    </p>
                  </div>
                )}
                {/* Timestamp and status for messages without text content */}
                {!message.content && (
                  <div className={`flex items-end text-righ justify-end gap-1 text-xs opacity-70 mt-1 ${isOwnMessage ? 'text-gray-700  dark:text-white/80' : 'text-foreground/80 dark:text-white/80'}`}>
                    {formatMessageTime(message.createdAt)}
                    {isOwnMessage && (
                      <span className={`ml-1 inline-flex items-center ${tickStatus === 'read' ? 'text-blue-400 dark:text-blue-400' : 'text-blue-400/70 dark:text-blue-400/70'}`}>
                        {tickStatus === 'sent' ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <CheckCheck className={`h-3.5 w-3.5 ${tickStatus === 'read' ? 'text-blue-400 dark:text-blue-400' : 'text-blue-400/70 dark:text-blue-400/70'}`} />
                        )}
                      </span>
                    )}
                  </div>
                )}
              </div>
              </>
            )}
          </div>
          {/* Buttons for own messages (left side) - appears on left with flex-row-reverse */}
          {isOwnMessage && (
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {!isDeleted && onReply && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReply(message._id);
                  }}
                  title="Reply to message"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </Button>
              )}
              {!isDeleted && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReactions(!showReactions);
                  }}
                >
                  <Smile className="h-3.5 w-3.5" />
                </Button>
              )}
              {!isDeleted && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
          {/* Buttons for other messages (right side) */}
          {!isOwnMessage && (
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {!isDeleted && onReply && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReply(message._id);
                  }}
                  title="Reply to message"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </Button>
              )}
              {!isDeleted && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReactions(!showReactions);
                  }}
                >
                  <Smile className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
        {/* Reactions bar below message */}
        {!isDeleted && message.reactions && Object.keys(message.reactions || {}).length > 0 && (
          <MessageReactions
            messageId={message._id}
            currentReactions={message.reactions || {}}
            userReactions={message.userReactions || []}
            compact
          />
        )}
      </div>
      <DeleteMessageDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        messageContent={message.content}
      />
    </div>
  );
}
