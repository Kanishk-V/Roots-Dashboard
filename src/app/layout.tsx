import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Provider } from "@/components/ui/provider";
import { ChakraProvider } from "@chakra-ui/react";
import Providers from "./providers";

// Load the Inter font from Google Fonts and set a CSS variable
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

/**
 * RootLayout - wraps all pages in the app
 *
 * - Sets up global metadata (title, description)
 * - Loads global styles and fonts
 * - Wraps all content with context providers (Chakra UI, custom Provider, etc.)
 * - Defines the HTML structure and applies the font
 *
 * This is the top-level layout for the entire Next.js app.
 */
export const metadata: Metadata = {
  title: "Roots Dashboard",
  description: "Dashboard for Roots listings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply the Inter font and antialiasing to the body */}
      <body className={`${inter.variable} antialiased`}>
        {/* Wrap all content with global providers */}
        <Providers>
          <ChakraProvider>
            <Provider>
              {children}
            </Provider>
          </ChakraProvider>
        </Providers>
      </body>
    </html>
  );
}
