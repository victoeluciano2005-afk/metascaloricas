import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/sugestoes")({
  head: () => ({ meta: [{ title: "Sugestões — NutriTrack" }, { name: "description", content: "Sugestões no NutriTrack." }] }),
  component: () => <AppShell><p className="text-muted-foreground">Sugestões em construção.</p></AppShell>,
});
