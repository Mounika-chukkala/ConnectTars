import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { DebugEnv } from "@/components/debug-env";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ConnectTars - Real-time Chat",
  description: "Real-time messaging app built with Next.js, Convex, and Clerk",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <ConvexClientProvider>{children}</ConvexClientProvider>
            <Toaster
              position="top-center"
              toastOptions={{
                className: "dark:bg-[#202C33] dark:text-white bg-white text-gray-900 border dark:border-gray-700",
                duration: 3000,
              }}
            />
            <DebugEnv />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
