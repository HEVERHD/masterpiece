"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushSubscribeButton() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setSupported(true);
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub);
        });
      });
    }
  }, []);

  async function toggle() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;

      if (subscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setSubscribed(false);
        toast.success("Notificaciones desactivadas");
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("Debes permitir las notificaciones en el navegador");
          return;
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          ),
        });
        const json = sub.toJSON();
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint, keys: json.keys }),
        });
        setSubscribed(true);
        toast.success("Notificaciones activadas 🔔");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al gestionar notificaciones");
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={subscribed ? "Notificaciones activadas — clic para desactivar" : "Activar notificaciones push"}
      className="relative p-2 rounded-lg transition-colors hover:bg-gold-900/30 disabled:opacity-50"
    >
      {subscribed ? (
        <>
          <Bell className="h-5 w-5 text-amber-400 fill-amber-400" />
          {/* punto verde = activo */}
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-green-400 ring-1 ring-brand-darker" />
        </>
      ) : (
        <BellOff className="h-5 w-5 text-gold-600" />
      )}
    </button>
  );
}
