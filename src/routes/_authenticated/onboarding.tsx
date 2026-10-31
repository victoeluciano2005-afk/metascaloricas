import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ProfileForm } from "@/components/ProfileForm";
import { saveProfileAndGoals } from "@/lib/data";
import { detectCountry } from "@/lib/countries";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Configurar perfil — NutriTrack" },
      { name: "description", content: "Defina seu objetivo e calcule sua meta diária de calorias." },
      { property: "og:title", content: "Configurar perfil — NutriTrack" },
      { property: "og:description", content: "Defina seu objetivo e calcule sua meta diária de calorias." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [country] = useState(detectCountry);
  return (
    <div className="mx-auto max-w-lg px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-10">
      <p className="text-sm font-semibold text-primary">Bem-vindo(a) 🌿</p>
      <h1 className="mt-1 text-3xl font-bold">Vamos montar seu plano</h1>
      <p className="mt-2 mb-6 text-muted-foreground">Leva menos de 1 minuto. Você pode alterar tudo depois no Perfil.</p>
      <ProfileForm
        initial={{ country }}
        askCountryConfirm
        submitLabel="Começar"
        onSubmit={async (v) => {
          try {
            await saveProfileAndGoals(v, true);
            await qc.invalidateQueries();
            toast.success("Plano criado! Bora começar 💚");
            navigate({ to: "/diario", replace: true });
          } catch {
            toast.error("Não foi possível salvar. Tente novamente.");
          }
        }}
      />
    </div>
  );
}
