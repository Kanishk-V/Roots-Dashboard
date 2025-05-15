import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Provider } from "@/components/ui/provider";
import { ChakraProvider } from "@chakra-ui/react";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

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
      <body className={`${inter.variable} antialiased`}>
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
