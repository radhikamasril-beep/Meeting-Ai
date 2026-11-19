import type { Metadata } from "next";
import "./globals.css";
import { Sidebar, Header } from "@/components/ui/layout";

export const metadata: Metadata = {
  title: "Meeting.ai - Autonomous Note Taker",
  description: "AI Note Taker untuk Zoom, Google Meet, Teams, dan offline audio.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#090d16] text-gray-100 antialiased selection:bg-indigo-500 selection:text-white">
        <Sidebar />
        <div className="pl-64 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
