import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "sonner";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Cooking Planner - Indian Recipes from Leftovers",
  description: "Find authenic Indian recipes using ingredients in your fridge before they expire.",
};

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans`}>
        <Providers>
          <div className="relative flex min-h-screen flex-col font-sans">
            <SiteHeader />
            <main className="flex-1 container mx-auto p-4">{children}</main>
          </div>
          <Toaster richColors position="bottom-center" />
        </Providers>
      </body>
    </html>
  );
}
