import type { Lang } from "@/i18n/translations";

// ─── Locale mapping ──────────────────────────────────────────────────────────
const LOCALE_MAP: Record<Lang, string> = {
  fr: "fr-FR",
  en: "en-GB",
  de: "de-DE",
  pt: "pt-PT",
  nl: "nl-NL",
  zh: "zh-CN",
  ko: "ko-KR",
  ja: "ja-JP",
};

const CURRENCY_MAP: Record<Lang, string> = {
  fr: "EUR",
  en: "GBP",
  de: "EUR",
  pt: "EUR",
  nl: "EUR",
  zh: "CNY",
  ko: "KRW",
  ja: "JPY",
};

// ─── Date formatting ─────────────────────────────────────────────────────────

/** Short date: "17 mars 2026" / "17 Mar 2026" / "2026年3月17日" */
export function formatDate(date: Date | string, lang: Lang): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(LOCALE_MAP[lang], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Short time: "14:32" (24h for FR/DE/NL/ZH/KO/JA, 12h for EN) */
export function formatTime(date: Date | string, lang: Lang): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString(LOCALE_MAP[lang], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Date + time combined: "17 mars 2026, 14:32" */
export function formatDateTime(date: Date | string, lang: Lang): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(LOCALE_MAP[lang], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Currency formatting ─────────────────────────────────────────────────────

/** Format monetary value: "2 400 000 €" / "¥2,400,000" */
export function formatCurrency(amount: number, lang: Lang, forceCurrency?: string): string {
  const currency = forceCurrency ?? CURRENCY_MAP[lang];
  return new Intl.NumberFormat(LOCALE_MAP[lang], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Number formatting ───────────────────────────────────────────────────────

/** Format large numbers with locale separator: "3 842" / "3,842" / "3.842" */
export function formatNumber(value: number, lang: Lang): string {
  return new Intl.NumberFormat(LOCALE_MAP[lang]).format(value);
}

// ─── ETA formatting ──────────────────────────────────────────────────────────

/** Relative duration: "+2.5h" stays as-is across locales (logistics standard) */
export function formatETADelta(deltaHours: number): string {
  if (deltaHours === 0) return "—";
  const sign = deltaHours > 0 ? "+" : "";
  return `${sign}${deltaHours.toFixed(1)}h`;
}
