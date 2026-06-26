import type { Metadata } from "next";
import { Inter, Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ThemeProvider } from "@/components/ThemeProvider";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
});
const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "Enterprise Work Management & Collaboration Platform",
  description: "A centralized digital workplace solution.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${plusJakarta.variable} font-sans antialiased text-foreground bg-background`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
