import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/" });
    const { data: profile } = await supabase.from("profiles").select("onboarded").eq("id", data.user.id).maybeSingle();
    const onboarded = !!profile?.onboarded;
    if (!onboarded && location.pathname !== "/onboarding") throw redirect({ to: "/onboarding" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
