# Loom Video Script - ConnectTars Project

## Video Structure (5 minutes total)

### 1. Introduction (30 seconds)
**What to say:**
- "Hi, I'm [Your Name], and I'm excited to present ConnectTars, a real-time messaging application I built."
- "ConnectTars is a modern chat app similar to WhatsApp, built with Next.js, TypeScript, Convex for the backend, and Clerk for authentication."
- "Today I'll walk you through the codebase, demo a key feature, and make a live code change."

---

### 2. Project Overview (1 minute)
**What to show:**
- Open your code editor (VS Code/Cursor)
- Show the project structure briefly:
  ```
  connect-tars/
  ├── app/              # Next.js pages
  ├── components/       # React components
  ├── convex/          # Backend functions
  └── lib/             # Utilities
  ```

**What to say:**
- "The app uses Next.js 16 with the App Router for the frontend."
- "Convex handles real-time database operations and WebSocket connections."
- "Clerk provides authentication with JWT tokens."
- "The UI is built with Tailwind CSS and shadcn/ui components."

---

### 3. Feature Walkthrough - Choose ONE of these (2 minutes)

#### Option A: Real-time Messaging
**What to show:**
1. Open `components/chat/message-list.tsx`
   - Explain how `useQuery` from Convex provides real-time updates
   - Show the message rendering logic
2. Open `convex/messages.ts`
   - Explain the `list` query that fetches messages
   - Show how it handles reactions and replies
3. Demo in browser:
   - Open the chat app
   - Send a message from one browser tab
   - Show it appearing instantly in another tab (real-time)

**What to say:**
- "One feature I'm proud of is the real-time messaging system."
- "Using Convex's reactive queries, messages appear instantly across all connected clients."
- "The `useQuery` hook automatically subscribes to changes and updates the UI."

---

#### Option B: Message Reactions System
**What to show:**
1. Open `components/chat/message-reactions.tsx`
   - Explain the reaction picker UI
   - Show how reactions are stored and displayed
2. Open `convex/messages.ts` (reactions handling)
   - Show how reactions are added/removed
3. Demo in browser:
   - Click on a message to show reaction picker
   - Add a reaction (👍, ❤️, etc.)
   - Show it updating in real-time

**What to say:**
- "I implemented a message reactions system similar to WhatsApp."
- "Users can react to messages with emojis, and reactions update in real-time."
- "The system uses Convex mutations for adding/removing reactions."

---

#### Option C: Group Chat Functionality
**What to show:**
1. Open `components/chat/group-info-dialog.tsx`
   - Show group creation and member management
2. Open `convex/conversations.ts`
   - Explain group conversation logic
3. Demo in browser:
   - Create a new group
   - Add members
   - Send messages in the group
   - Show names appearing for each message

**What to say:**
- "I built a complete group chat system with member management."
- "Groups can have multiple participants, and the UI shows sender names for clarity."
- "The system handles both individual and group conversations seamlessly."

---

### 4. Live Code Change (1.5 minutes)

**Suggested changes (pick one):**

#### Change 1: Update Message Bubble Color
1. Open `components/chat/message-item.tsx`
2. Find the message bubble background (around line 190)
3. Change the color:
   ```tsx
   // Before:
   ? "bg-gradient-to-br from-slate-100 to-slate-200"
   
   // After (example):
   ? "bg-gradient-to-br from-purple-100 to-purple-200"
   ```
4. Save the file
5. Show it updating in the browser instantly (hot reload)

**What to say:**
- "Now I'll make a live code change to demonstrate the development workflow."
- "I'm changing the message bubble color from slate to purple."
- "With Next.js hot reload, changes appear instantly without refreshing."

---

#### Change 2: Update Button Text
1. Open `components/chat/message-input.tsx`
2. Find the send button or input placeholder
3. Change the text:
   ```tsx
   // Before:
   placeholder="Type a message..."
   
   // After:
   placeholder="Start typing..."
   ```
4. Save and show the change in browser

---

#### Change 3: Add a Console Log
1. Open `components/chat/message-item.tsx`
2. Add a console.log in the component:
   ```tsx
   useEffect(() => {
     console.log("Message rendered:", message.content);
   }, [message]);
   ```
3. Show the console output in browser DevTools

---

### 5. Closing (30 seconds)
**What to say:**
- "That's a quick overview of ConnectTars."
- "The app includes features like real-time messaging, reactions, group chats, file uploads, and more."
- "All the code is available on GitHub, and the app is deployed on Vercel."
- "Thank you for watching!"

---

## Tips for Recording

### Before Recording:
1. ✅ Test your camera and microphone
2. ✅ Close unnecessary applications
3. ✅ Have your browser open with the app running
4. ✅ Have your code editor ready with the files you'll show
5. ✅ Test screen sharing works properly

### During Recording:
1. ✅ Speak clearly and at a moderate pace
2. ✅ Make sure your face is visible (use Loom's camera feature)
3. ✅ Zoom in on code when explaining (use Cmd/Ctrl + to zoom)
4. ✅ Highlight code with your cursor as you explain
5. ✅ Show the browser demo clearly

### Code Files to Have Ready:
- `components/chat/message-item.tsx` - Message display
- `components/chat/message-list.tsx` - Message list with real-time
- `components/chat/message-input.tsx` - Message sending
- `convex/messages.ts` - Backend message logic
- `app/chat/page.tsx` - Main chat page

### Browser Demo Checklist:
- ✅ App is running on localhost:3000
- ✅ You're logged in
- ✅ Have a conversation open
- ✅ Be ready to send a test message
- ✅ Have DevTools open (F12) if showing console

---

## Quick Reference - Key Features to Mention

1. **Real-time Updates** - Convex WebSocket connections
2. **Message Reactions** - Emoji reactions on messages
3. **Group Chats** - Multi-user conversations
4. **File Uploads** - Images, videos, documents, audio
5. **Read Receipts** - Blue ticks for read messages
6. **Typing Indicators** - Shows when users are typing
7. **Online Status** - Green dot for online users
8. **Message Replies** - Reply to specific messages
9. **Dark/Light Mode** - Theme switching
10. **Responsive Design** - Works on mobile and desktop

---

## Sample Script (Full 5 minutes)

### [0:00-0:30] Introduction
"Hi, I'm [Name], and I'm presenting ConnectTars, a real-time messaging application I built using Next.js, Convex, and Clerk. It's similar to WhatsApp with features like group chats, message reactions, and file sharing."

### [0:30-1:30] Project Overview
"Let me show you the project structure. The frontend uses Next.js 16 with TypeScript, the backend is powered by Convex for real-time database operations, and Clerk handles authentication. The UI uses Tailwind CSS for styling."

### [1:30-3:30] Feature Demo - Real-time Messaging
"One feature I'm proud of is the real-time messaging system. Let me show you the code. In `message-list.tsx`, I use Convex's `useQuery` hook which automatically subscribes to database changes. When a new message is added, it appears instantly across all connected clients without any polling or manual refresh. Let me demonstrate this in the browser..."

[Show demo: Send message, show it appearing in real-time]

### [3:30-5:00] Live Code Change
"Now I'll make a live code change. I'm going to update the message bubble color. Let me open `message-item.tsx` and change the background from slate to purple. [Make change, save] And as you can see, with Next.js hot reload, the change appears instantly in the browser without any refresh."

### [5:00-5:30] Closing
"That's ConnectTars - a fully functional real-time messaging app with modern features. The code is on GitHub and deployed on Vercel. Thanks for watching!"

---

## Checklist Before Submitting

- [ ] Video is exactly 5 minutes (or close to it)
- [ ] Your face is visible at the beginning
- [ ] Code is clearly visible and readable
- [ ] Browser demo works smoothly
- [ ] Live code change is shown and works
- [ ] Audio is clear and understandable
- [ ] Video quality is good (at least 720p)

Good luck with your submission! 🎥
