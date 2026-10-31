import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/buscar")({
  validateSearch: z.object({ date: z.string().optional(), meal: z.string().optional() }),
  head: () => ({ meta: [{ title: "Buscar alimentos — NutriTrack" }, { name: "description", content: "Busque alimentos e veja calorias." }] }),
  component: () => <AppShell><p className="text-muted-foreground">Busca de alimentos em construção.</p></AppShell>,
});
