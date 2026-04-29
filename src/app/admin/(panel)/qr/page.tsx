import { QRPageClient } from "./QRPageClient";

export default function QRPage() {
  const storeUrl =
    process.env.NEXT_PUBLIC_URL?.startsWith("http://localhost")
      ? "https://masterpiecectg.com"
      : (process.env.NEXT_PUBLIC_URL ?? "https://masterpiecectg.com");

  return <QRPageClient storeUrl={storeUrl} />;
}
