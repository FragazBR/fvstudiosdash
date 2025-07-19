
import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/hooks/useUser";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FVSTUDIOS - Dashboard",
  description: "Gerenciamento em um só lugar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
