"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Contraseña incorrecta. Intenta de nuevo.");
      } else {
        router.push("/admin/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-darker flex items-center justify-center p-4">
      {/* Subtle gold texture overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold-900/20 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="Masterpiece CTG"
            width={240}
            height={70}
            className="h-16 w-auto object-contain mx-auto"
            priority
          />
        </div>

        <Card className="border border-gold-800/30 shadow-2xl bg-brand-dark/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-center gap-2 text-gold-500 mb-1">
              <Lock className="h-4 w-4" />
              <p className="text-sm font-medium tracking-wide">Acceso Administrador</p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gold-300">Correo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold-700" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@ejemplo.com"
                    required
                    autoFocus
                    className="pl-10 bg-brand-darker/50 border-gold-800/50 text-gold-100 placeholder:text-gold-800 focus-visible:ring-gold-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gold-300">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pr-10 bg-brand-darker/50 border-gold-800/50 text-gold-100 placeholder:text-gold-800 focus-visible:ring-gold-500"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-700 hover:text-gold-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-gold-500 hover:bg-gold-400 text-brand-darker font-bold tracking-wide"
                disabled={loading}
              >
                {loading ? "Verificando..." : "Entrar al panel"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
