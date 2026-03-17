import { useLanguage } from "@/i18n/LanguageContext";
import { t as translate } from "@/i18n/translations";
import type { TranslationKey } from "@/i18n/translations";

export function useTranslation() {
  const { lang } = useLanguage();
  return (key: TranslationKey) => translate(lang, key);
}
