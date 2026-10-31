import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/progresso")({
  head: () => ({ meta: [{ title: "Progresso — NutriTrack" }, { name: "description", content: "Progresso no NutriTrack." }] }),
  component: () => <AppShell><p className="text-muted-foreground">Progresso em construção.</p></AppShell>,
});
