import i18n from "@/i18n";

export async function getTranslation(locale = "pt") {
  // SSR-safe translation util
  return (key: string) => {
    return i18n.t(key, { lng: locale });
  };
}
