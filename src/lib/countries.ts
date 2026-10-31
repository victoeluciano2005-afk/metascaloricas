export const COUNTRIES: { code: string; name: string; flag: string }[] = [
  { code: "BR", name: "Brasil", flag: "🇧🇷" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "MX", name: "México", flag: "🇲🇽" },
  { code: "CO", name: "Colômbia", flag: "🇨🇴" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "PE", name: "Peru", flag: "🇵🇪" },
  { code: "ES", name: "Espanha", flag: "🇪🇸" },
  { code: "IT", name: "Itália", flag: "🇮🇹" },
  { code: "FR", name: "França", flag: "🇫🇷" },
  { code: "DE", name: "Alemanha", flag: "🇩🇪" },
  { code: "GB", name: "Reino Unido", flag: "🇬🇧" },
  { code: "JP", name: "Japão", flag: "🇯🇵" },
  { code: "IN", name: "Índia", flag: "🇮🇳" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "CA", name: "Canadá", flag: "🇨🇦" },
  { code: "AO", name: "Angola", flag: "🇦🇴" },
  { code: "MZ", name: "Moçambique", flag: "🇲🇿" },
];

export function countryName(code?: string | null) {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code ?? "";
}

export function detectCountry(): string {
  if (typeof navigator === "undefined") return "BR";
  const langs = [navigator.language, ...(navigator.languages ?? [])];
  for (const l of langs) {
    const region = l?.split("-")[1]?.toUpperCase();
    if (region && COUNTRIES.some((c) => c.code === region)) return region;
  }
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  if (tz.startsWith("America/Sao_Paulo") || tz.includes("Brazil")) return "BR";
  if (tz === "Europe/Lisbon") return "PT";
  const lang = navigator.language?.slice(0, 2);
  if (lang === "pt") return "BR";
  if (lang === "es") return "ES";
  return "US";
}
