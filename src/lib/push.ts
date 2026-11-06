import { supabase } from "@/integrations/supabase/client";

export const VAPID_PUBLIC_KEY = "BEkC-Nj0necomqcRjFuUXn7fjLAllIOi68pdNCijyj8z_vwBMcjcL6tEcKt4snODnoaP_aHdB4eOUN75HJwMPBM";

export type PushResult = "registered" | "unsupported" | "open-in-new-tab" | "denied" | "ios-install" | "error";

function keyBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function pushStatus(): Promise<"on" | "off" | "unsupported"> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
  const reg = await navigator.serviceWorker.getRegistration("/push-sw.js");
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === "granted" ? "on" : "off";
}

// Must be called from a click.
export async function enablePush(): Promise<PushResult> {
  if (window.top !== window.self) return "open-in-new-tab";
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return isIOS && !standalone ? "ios-install" : "unsupported";
  }
  const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (perm !== "granted") return "denied";
  try {
    const reg = await navigator.serviceWorker.register("/push-sw.js");
    await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) }));
    const j = sub.toJSON();
    const { error } = await supabase.from("push_subscriptions").upsert(
      { endpoint: sub.endpoint, p256dh: j.keys!.p256dh!, auth: j.keys!.auth! },
      { onConflict: "endpoint" },
    );
    if (error) throw error;
    return "registered";
  } catch (e) {
    console.error(e);
    return "error";
  }
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration("/push-sw.js");
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    await sub.unsubscribe();
  }
}

/** Records that the user opened the app (drives the reminder tone). */
export async function markOpened() {
  const { data } = await supabase.auth.getUser();
  if (data.user) await supabase.from("profiles").update({ last_opened_at: new Date().toISOString() }).eq("id", data.user.id);
}
