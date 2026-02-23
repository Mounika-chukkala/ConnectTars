"use client";

export function DebugEnv() {
  if (process.env.NODE_ENV === "production") return null;

  const hasConvexUrl = !!process.env.NEXT_PUBLIC_CONVEX_URL;
  const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!hasConvexUrl || !hasClerkKey) {
    return (
      <div className="fixed bottom-4 right-4 rounded-lg border-2 border-red-500 bg-red-50 p-4 text-sm">
        <p className="font-bold text-red-700">⚠️ Missing Environment Variables:</p>
        <ul className="mt-2 list-disc pl-5 text-red-600">
          {!hasConvexUrl && <li>NEXT_PUBLIC_CONVEX_URL</li>}
          {!hasClerkKey && <li>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</li>}
        </ul>
        <p className="mt-2 text-xs text-red-500">
          Create a .env.local file with these variables
        </p>
      </div>
    );
  }

  return null;
}
