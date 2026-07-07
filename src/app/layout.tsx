import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthSessionProvider } from "@/components/auth/session-provider";
import { AppFooter } from "@/components/branding/footer";
import { GlitchBackdrop } from "@/components/branding/glitch-backdrop";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NS Poker",
  description: "Splitwise for Network School poker nights",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NS Poker",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f1a14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-dvh bg-background">
        <AuthSessionProvider>
          <GlitchBackdrop />
          <div className="relative z-10 flex min-h-dvh flex-col">
            <div className="flex flex-1 flex-col pb-[calc(3.25rem+env(safe-area-inset-bottom))]">
              {children}
            </div>
            <AppFooter />
          </div>
        </AuthSessionProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
