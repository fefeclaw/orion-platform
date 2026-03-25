"use client";

/**
 * Language store — module-level singleton with useSyncExternalStore.
 *
 * Why not React Context?
 * In Next.js 14 App Router the context provider lives in a Server Component
 * boundary (layout.tsx). Async chunk loading means page.js may execute before
 * layout.js, causing consumers to receive the default no-op context value.
 * useSyncExternalStore bypasses this entirely: every component subscribes to
 * the same module-level store regardless of chunk load order.
 */

import React, { useSyncExternalStore, useCallback, useEffect } from "react";
import type { Lang } from "./translations";

const VALID_LANGS: Lang[] = ["fr", "en", "de", "pt", "nl", "zh", "ko", "ja"];
const STORAGE_KEY = "orion-lang";

// ── Module-level store (one instance per browser tab) ──────────────────────
let _lang: Lang = "fr";
const _listeners = new Set<() => void>();

function _subscribe(fn: () => void): () => void {
  _listeners.add(fn);
  return () => { _listeners.delete(fn); };
}

function _getSnapshot(): Lang {
  return _lang;
}

// Server snapshot: always "fr" — avoids hydration mismatch
function _getServerSnapshot(): Lang {
  return "fr";
}

// ── Public API ─────────────────────────────────────────────────────────────

/** Change the active language and persist it. */
export function setGlobalLang(l: Lang): void {
  if (!VALID_LANGS.includes(l) || _lang === l) return;
  _lang = l;
  try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("lang", l);
  }
  // Notify all subscribers synchronously
  _listeners.forEach(fn => fn());
}

// ── React hooks ────────────────────────────────────────────────────────────

/**
 * Returns { lang, setLang } — subscribes directly to the module-level store.
 * Works in any Client Component regardless of provider tree position.
 */
export function useLanguage() {
  const lang = useSyncExternalStore(_subscribe, _getSnapshot, _getServerSnapshot);
  const setLang = useCallback((l: Lang) => setGlobalLang(l), []);
  return { lang, setLang };
}

// ── Provider ───────────────────────────────────────────────────────────────

/**
 * Reads the persisted language from localStorage after hydration
 * and initialises the store. Must be rendered once at the root (layout.tsx).
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved && VALID_LANGS.includes(saved)) {
        setGlobalLang(saved);
      }
    } catch { /* localStorage unavailable */ }
  }, []);

  // No wrapper needed — the store is module-level, not context-based
  return <>{children}</>;
}
