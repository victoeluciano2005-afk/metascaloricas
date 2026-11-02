import { Link } from "@tanstack/react-router";
import { BookOpen, Search, Sparkles, TrendingUp, User } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { foodEmoji } from "@/lib/food-emoji";

const TABS = [
  { to: "/diario", label: "Diário", icon: BookOpen },
  { to: "/buscar", label: "Buscar", icon: Search },
  { to: "/sugestoes", label: "Sugestões", icon: Sparkles },
  { to: "/progresso", label: "Progresso", icon: TrendingUp },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function AppShell({ children, header }: { children: ReactNode; header?: ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background">
      {header && (
        <div className="sticky top-0 z-30 border-b bg-background/90 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 backdrop-blur">
          {header}
        </div>
      )}
      <main className="px-4 pt-4 pb-28">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur pb-safe">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {TABS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className="flex flex-col items-center gap-1 pt-2.5 pb-1 text-[11px] font-medium text-muted-foreground"
                activeProps={{ className: "text-primary" }}
              >
                {({ isActive }) => (
                  <>
                    <span className={cn("rounded-full px-4 py-1 transition-colors", isActive && "bg-primary-soft")}>
                      <Icon className="size-5" />
                    </span>
                    {label}
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center">
      <p className="text-sm text-foreground">😕 {message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-sm font-semibold text-primary">
          Tentar novamente
        </button>
      )}
    </div>
  );
}

// Animated emoji that represents the food/drink (no product photos).
export function FoodImg({ alt, className }: { src?: string | null; alt: string; className?: string }) {
  return (
    <span role="img" aria-label={alt} className={cn("flex items-center justify-center bg-transparent", className)}>
      <span className="animate-food-float select-none text-[2.4em] leading-none drop-shadow-sm">{foodEmoji(alt)}</span>
    </span>
  );
}
