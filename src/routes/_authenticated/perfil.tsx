import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Perfil — NutriTrack" }, { name: "description", content: "Perfil no NutriTrack." }] }),
  component: () => <AppShell><p className="text-muted-foreground">Perfil em construção.</p></AppShell>,
});
