import type { Metadata } from "next";
import { Oswald, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import Header from "@/components/layout/Header";
import Providers from "@/components/Providers";
import PageFade from "@/components/PageFade";
import VideoBackground from "@/components/VideoBackground";
import "./globals.css";

const display = Oswald({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OP-DB-StatTracker",
  description: "Guías, emparejador y estadísticas para One Piece Card Game",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${display.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <VideoBackground />
        <Providers>
          <Header />
          <main className="flex-1">
            <PageFade>{children}</PageFade>
          </main>
          <footer className="border-t border-border py-6 text-center text-sm text-muted bg-surface/60 backdrop-blur-sm">
            OP-DB-StatTracker · uso personal · fan project
          </footer>
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
