import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { enablePush, pushStatus } from "@/lib/push";

const KEY = "nt-push-prompt-dismissed";

/** Asks for notification permission on open; if blocked, guides the user to the phone settings. */
export function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [guide, setGuide] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    if (window.top !== window.self) return;
    const dismissed = Number(localStorage.getItem(KEY) ?? 0);
    if (Date.now() - dismissed < 86400000) return;
    pushStatus().then((s) => setShow(s !== "on")).catch(() => {});
  }, []);

  const activate = async () => {
    const r = await enablePush();
    if (r === "registered") { setShow(false); toast.success("Lembretes ativados. Sem desculpas a partir de agora."); }
    else setGuide(true);
  };
  const close = () => { localStorage.setItem(KEY, String(Date.now())); setShow(false); };

  return (
    <>
      {show && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary-soft p-3">
          <Bell className="size-5 shrink-0 text-primary" />
          <p className="flex-1 text-sm font-medium">Ative as notificações para não perder suas cobranças diárias.</p>
          <Button size="sm" className="rounded-full" onClick={activate}>Ativar</Button>
          <button onClick={close} aria-label="Fechar" className="text-muted-foreground"><X className="size-4" /></button>
        </div>
      )}
      <Dialog open={guide} onOpenChange={setGuide}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle>Libere as notificações no celular</DialogTitle></DialogHeader>
          {ios ? (
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              <li>Se ainda não instalou: no Safari, toque em <b>Compartilhar</b> → <b>Adicionar à Tela de Início</b> e abra o NutriTrack pelo ícone.</li>
              <li>Abra o app <b>Ajustes</b> do iPhone.</li>
              <li>Toque em <b>Notificações</b> → <b>NutriTrack</b>.</li>
              <li>Ative <b>Permitir Notificações</b> e volte aqui para tocar em Ativar.</li>
            </ol>
          ) : (
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              <li>Abra o app <b>Configurações</b> do celular.</li>
              <li>Toque em <b>Apps</b> (ou Aplicativos) → <b>NutriTrack</b>. Se não aparecer, escolha <b>Chrome</b>.</li>
              <li>Toque em <b>Notificações</b> e ative <b>Permitir notificações</b>.</li>
              <li>No Chrome, também confira: <b>⋮ → Configurações → Configurações do site → Notificações</b> e permita este site.</li>
              <li>Volte ao app e toque em <b>Ativar</b> de novo.</li>
            </ol>
          )}
          <Button className="mt-2 rounded-full" onClick={async () => { setGuide(false); await activate(); }}>Já liberei, ativar agora</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
