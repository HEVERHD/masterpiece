import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CartSheet } from "@/components/catalog/CartSheet";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";

const inter = Inter({ subsets: ["latin"] });

const BASE_URL = "https://masterpiecectg.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Masterpiece CTG | Ropa y Accesorios en Cartagena",
    template: "%s | Masterpiece CTG",
  },
  description:
    "Tienda de ropa y accesorios de moda en Cartagena de Indias. Gorras, bermudas, boxers y más. Pide por WhatsApp con domicilio a toda la ciudad y envíos nacionales.",
  keywords: [
    "ropa Cartagena",
    "tienda de ropa Cartagena",
    "accesorios Cartagena",
    "gorras Cartagena",
    "bermudas Cartagena",
    "moda Cartagena de Indias",
    "ropa hombre Cartagena",
    "Masterpiece CTG",
    "masterpiece cartagena",
    "ropa por WhatsApp Cartagena",
    "domicilio ropa Cartagena",
  ],
  authors: [{ name: "Masterpiece CTG" }],
  creator: "Masterpiece CTG",
  manifest: "/manifest.json",
  icons: {
    icon: "/MasterFavicon.png",
    apple: "/MasterFavicon.png",
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: BASE_URL,
    siteName: "Masterpiece CTG",
    title: "Masterpiece CTG | Ropa y Accesorios en Cartagena",
    description:
      "Tienda de ropa y accesorios de moda en Cartagena de Indias. Gorras, bermudas, boxers y más. Pide por WhatsApp.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Masterpiece CTG — Ropa y Accesorios en Cartagena",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Masterpiece CTG | Ropa y Accesorios en Cartagena",
    description:
      "Tienda de ropa y accesorios en Cartagena de Indias. Gorras, bermudas, boxers y más.",
    images: ["/logo.png"],
  },
  alternates: {
    canonical: BASE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Masterpiece CTG",
  },
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: "Masterpiece CTG",
  description:
    "Tienda de ropa y accesorios de moda en Cartagena de Indias. Gorras, bermudas, boxers y más.",
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  image: `${BASE_URL}/logo.png`,
  telephone: "+57",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Cartagena de Indias",
    addressRegion: "Bolívar",
    addressCountry: "CO",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 10.391049,
    longitude: -75.479426,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday",
    ],
    opens: "09:00",
    closes: "21:00",
  },
  sameAs: [
    "https://www.instagram.com/tutiendampc",
    "https://www.facebook.com/Masterpiecectg",
  ],
  priceRange: "$$",
  currenciesAccepted: "COP",
  paymentAccepted: "Cash, Nequi, Bancolombia, DaviPlata",
  areaServed: {
    "@type": "City",
    name: "Cartagena de Indias",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
      </head>
      <body className={inter.className}>
        <ServiceWorkerRegister />
        <WishlistProvider>
          <CartProvider>
            {children}
            <CartSheet />
            <PWAInstallBanner />
          </CartProvider>
        </WishlistProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
