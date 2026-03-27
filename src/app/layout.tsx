import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Postscript Intel | E-commerce Tech Stack Analyzer",
  description:
    "Analyze e-commerce stores to identify their tech stack, marketing tools, and sales opportunities.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
