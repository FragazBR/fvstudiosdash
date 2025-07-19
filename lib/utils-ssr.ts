// Temporariamente desabilitado - conflitos createContext
// import i18n from "@/i18n";

export async function getTranslation(locale = "pt") {
  // SSR-safe translation util - desabilitado temporariamente
  return (key: string) => {
    return key; // Retorna a própria chave até resolver i18n
  };
}
