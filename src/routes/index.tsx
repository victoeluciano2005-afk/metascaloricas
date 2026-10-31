import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero-food.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NutriTrack — Entre e comece a contar calorias" },
      { name: "description", content: "Entre com Google e acompanhe calorias, macros e peso de forma simples." },
      { property: "og:title", content: "NutriTrack — Entre e comece a contar calorias" },
      { property: "og:description", content: "Entre com Google e acompanhe calorias, macros e peso de forma simples." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/diario", replace: true });
    });
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) navigate({ to: "/diario", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const signIn = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("Não foi possível entrar com Google. Tente novamente.");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/diario", replace: true });
  };

  return (
    <main className="relative min-h-dvh overflow-hidden bg-hero">
      <img src={hero} alt="" width={1024} height={1280} className="absolute inset-0 h-[62%] w-full object-cover" />
      <div className="relative flex min-h-dvh flex-col justify-end">
        <div className="rounded-t-[2rem] bg-background px-6 pt-8 pb-10 shadow-card">
          <div className="mx-auto max-w-md">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              🌿 NutriTrack
            </div>
            <h1 className="text-3xl font-bold leading-tight">Coma bem, sem complicação.</h1>
            <p className="mt-2 text-muted-foreground">
              Conte calorias, acompanhe seus macros e descubra refeições saudáveis do seu país.
            </p>
            <Button onClick={signIn} disabled={loading} variant="outline" size="lg" className="mt-8 h-14 w-full rounded-full text-base font-semibold">
              {loading ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
              Entrar com Google
            </Button>
            <p className="mt-4 text-center text-xs text-muted-foreground">Seus dados ficam protegidos e só você tem acesso.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
