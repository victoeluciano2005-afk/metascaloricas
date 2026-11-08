import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { reminderMessage, reminderTone, isDayComplete } from "@/lib/progress";

const VAPID_PUBLIC_KEY = "BEkC-Nj0necomqcRjFuUXn7fjLAllIOi68pdNCijyj8z_vwBMcjcL6tEcKt4snODnoaP_aHdB4eOUN75HJwMPBM";
const DAY = 86400000;

export const Route = createFileRoute("/api/public/jobs/reminders")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        const privateKey = process.env['VAPID_PRIVATE_KEY'];
        if (!privateKey) return new Response("Missing VAPID key", { status: 500 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const WebPush = await import("@portable/web-push");
        const { data: subs, error } = await supabaseAdmin.from("push_subscriptions").select("*");
        if (error) return new Response(error.message, { status: 500 });
        const userIds = [...new Set((subs ?? []).map((s) => s.user_id))];
        if (!userIds.length) return Response.json({ sent: 0 });

        const since = new Date(Date.now() - 7 * DAY).toISOString().slice(0, 10);
        const [{ data: profiles }, { data: goals }, { data: logs }] = await Promise.all([
          supabaseAdmin.from("profiles").select("id, last_opened_at").in("id", userIds),
          supabaseAdmin.from("goals").select("user_id, calories").in("user_id", userIds),
          supabaseAdmin.from("food_logs").select("user_id, log_date, calories").in("user_id", userIds).gte("log_date", since),
        ]);

        const now = Date.now();
        const messages = new Map<string, string>();
        for (const id of userIds) {
          const goal = goals?.find((g) => g.user_id === id)?.calories ?? 0;
          const byDay = new Map<string, number>();
          for (const l of logs ?? []) if (l.user_id === id) byDay.set(l.log_date, (byDay.get(l.log_date) ?? 0) + Number(l.calories));
          const completionRate = [...byDay.values()].filter((k) => isDayComplete(k, goal)).length / 7;
          const lastLog = [...byDay.keys()].sort().at(-1);
          const opened = profiles?.find((p) => p.id === id)?.last_opened_at;
          const lastSeen = Math.max(opened ? Date.parse(opened) : 0, lastLog ? Date.parse(`${lastLog}T12:00:00Z`) : 0);
          const daysAway = lastSeen ? Math.floor((now - lastSeen) / DAY) : 30;
          const tone = reminderTone({ daysSinceLastLog: daysAway, completionRate });
          messages.set(id, reminderMessage(tone, Math.random()));
        }

        let sent = 0;
        for (const s of subs ?? []) {
          try {
            const r = await WebPush.send({
              subscription: { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              payload: JSON.stringify({ title: "NutriTrack", body: messages.get(s.user_id), url: "/diario" }),
              vapid: { subject: "mailto:contato@nutritrack.app", publicKey: VAPID_PUBLIC_KEY, privateKey },
              ttl: 3600 * 6,
            });
            if (r.kind === "gone") await supabaseAdmin.from("push_subscriptions").delete().eq("id", s.id);
            else sent++;
          } catch (e) {
            console.error("push failed", e);
          }
        }
        return Response.json({ sent });
      },
    },
  },
});
