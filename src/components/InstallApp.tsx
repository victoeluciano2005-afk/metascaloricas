import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);
  const [ios, setIos] = useState(false);
  const [embedded, setEmbedded] = useState(false);

  useEffect(() => {
    const mode = window.matchMedia("(display-mode: standalone)");
    const check = () => setInstalled(mode.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    check();
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    setEmbedded(window.self !== window.top || /(?:lovableproject|id-preview|preview--|project--)/.test(window.location.hostname));
    const available = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const done = () => { setInstalled(true); setPrompt(null); setHelp(false); };
    window.addEventListener("beforeinstallprompt", available);
    window.addEventListener("appinstalled", done);
    mode.addEventListener("change", check);
    return () => {
      window.removeEventListener("beforeinstallprompt", available);
      window.removeEventListener("appinstalled", done);
      mode.removeEventListener("change", check);
    };
  }, []);

  const install = async () => {
    if (!prompt || embedded) { setHelp(true); return; }
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setPrompt(null);
    } catch { setPrompt(null); setHelp(true); }
  };

  if (installed) return null;
  return (
    <>
      <Button variant="outline" className="mt-4 w-full" onClick={install}><Download />Instalar NutriTrack</Button>
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Instalar NutriTrack</DialogTitle>
            <DialogDescription>
              {embedded ? "Abra o endereço publicado no navegador do celular para instalar." : ios ? "No Safari, toque em Compartilhar, escolha Adicionar à Tela de Início e confirme em Adicionar." : "No Chrome, abra o menu ⋮ e escolha Instalar aplicativo ou Adicionar à tela inicial. Selecione Instalar, quando disponível."}
            </DialogDescription>
          </DialogHeader>
          {embedded && <Button asChild><a href="https://metascaloricas.lovable.app" target="_blank" rel="noopener noreferrer">Abrir aplicativo publicado</a></Button>}
        </DialogContent>
      </Dialog>
    </>
  );
}