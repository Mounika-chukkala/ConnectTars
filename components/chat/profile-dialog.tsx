"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/nextjs";
import { Avatar } from "@/components/ui/avatar";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: Id<"users">;
}

export function ProfileDialog({
  open,
  onOpenChange,
  currentUserId,
}: ProfileDialogProps) {
  const { user } = useUser();
  const currentUser = useQuery(api.users.get, { userId: currentUserId });
  const updateName = useMutation(api.users.updateName);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!name.trim() || name.trim() === currentUser?.name) {
      onOpenChange(false);
      return;
    }

    setIsSaving(true);
    try {
      await updateName({
        userId: currentUserId,
        name: name.trim(),
        clerkId: user?.id,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Profile</DialogTitle>
          <DialogDescription>
            Update your profile information. Changes will be reflected across all conversations.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center gap-4">
            <Avatar
              src={user?.imageUrl}
              alt={currentUser?.name || "User"}
              fallback={(currentUser?.name || "U").charAt(0).toUpperCase()}
              className="h-20 w-20"
            />
            <div className="text-sm text-muted-foreground">
              Profile picture is managed by your authentication provider
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={currentUser?.email || ""}
              disabled
              className="bg-muted"
            />
            <div className="text-xs text-muted-foreground">
              Email cannot be changed here
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Username</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your username"
              maxLength={50}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
