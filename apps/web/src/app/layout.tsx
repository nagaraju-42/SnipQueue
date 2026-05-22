import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ToastProvider } from "@/components/ui/ToastProvider";

export const metadata: Metadata = {
  title: "SnipQ | Real-Time Salon Slot Booking",
  description: "Eliminate unpredictable queues at barbershops. Book a slot, pay ₹10 to confirm, track your position live.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <footer className="py-6 text-center text-sm text-gray-500 border-t border-border mt-auto">
          © {new Date().getFullYear()} SnipQ. All rights reserved.
        </footer>
        <ToastProvider />
      </body>
    </html>
  );
}
