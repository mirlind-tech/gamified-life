import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { CyberpunkBackground } from "@/components/Avatar3D";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mirlind Protocol - Gamified Life OS",
  description: "Level up your life with ruthless execution",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <CyberpunkBackground />
        <AuthProvider>
          <WebSocketProvider>
            {children}
          </WebSocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
