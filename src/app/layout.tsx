import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Masterpiece CTG",
  description: "Ropa y accesorios de calidad en Cartagena",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_URL ?? "https://masterpiece-brown.vercel.app"
  ),
  manifest: "/manifest.json",
  icons: {
    icon: "/MasterFavicon.png",
    apple: "/MasterFavicon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Masterpiece CTG",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#f59e0b" />
      </head>
      <body className={inter.className}>
        <ServiceWorkerRegister />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
