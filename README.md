# ConnectTars - Real-time Chat Application

A real-time messaging web application built with Next.js, TypeScript, Convex, and Clerk.

## Features

- ✅ **Authentication** - Sign up, log in, and log out with Clerk
- ✅ **User List & Search** - Find and search for other users
- ✅ **One-on-One Direct Messages** - Private conversations with real-time updates
- ✅ **Message Timestamps** - Smart formatting (time, date, year)
- ✅ **Empty States** - Helpful messages when there's no data
- ✅ **Responsive Layout** - Desktop sidebar + mobile-friendly views
- ✅ **Online/Offline Status** - Real-time user presence indicators
- ✅ **Typing Indicator** - Shows when users are typing
- ✅ **Unread Message Count** - Badge showing unread messages
- ✅ **Smart Auto-Scroll** - Auto-scrolls to new messages with manual override
- ✅ **Delete Own Messages** - Soft delete with "This message was deleted" display
- ✅ **Message Reactions** - React to messages with emojis (👍 ❤️ 😂 😮 😢)
- ✅ **Loading & Error States** - Skeleton loaders and error handling
- ✅ **Group Chat** - Create group conversations with multiple members

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Convex** (Backend, Database, Realtime)
- **Clerk** (Authentication)
- **Tailwind CSS** (Styling)
- **shadcn/ui** (UI Components)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Clerk account (free tier available)
- A Convex account (free tier available)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd connect-tars
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CONVEX_URL=your_convex_url
CLERK_JWT_ISSUER_DOMAIN=your_clerk_jwt_issuer_domain
```

4. Set up Clerk:
   - Go to [clerk.com](https://clerk.com) and create an account
   - Create a new application
   - Copy your publishable key and secret key
   - Set up the JWT issuer domain in Clerk settings

5. Set up Convex:
   - Run `npx convex dev` to initialize Convex
   - Follow the prompts to create a new project
   - Copy the Convex URL to your `.env.local` file
   - Configure Clerk authentication in Convex dashboard

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
connect-tars/
├── app/                    # Next.js app directory
│   ├── chat/              # Chat page
│   ├── sign-in/           # Sign in page
│   ├── sign-up/           # Sign up page
│   └── layout.tsx         # Root layout
├── components/             # React components
│   ├── chat/              # Chat-related components
│   └── ui/                # Reusable UI components
├── convex/                # Convex backend
│   ├── schema.ts          # Database schema
│   ├── auth.ts            # Authentication functions
│   ├── users.ts           # User queries/mutations
│   ├── conversations.ts   # Conversation queries/mutations
│   ├── messages.ts        # Message queries/mutations
│   ├── presence.ts        # Online/offline status
│   └── typing.ts          # Typing indicators
├── lib/                   # Utility functions
└── public/                # Static assets
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add your environment variables in Vercel dashboard
4. Deploy!

The app will automatically deploy on every push to the main branch.

## License

MIT
