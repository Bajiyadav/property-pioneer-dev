import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "./locales/en.json";
import hiTranslations from "./locales/hi.json";
import teTranslations from "./locales/te.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    hi: { translation: hiTranslations },
    te: { translation: teTranslations },
  },
  lng: "en", // default language
  fallbackLng: "en",
  react: {
    useSuspense: false,
  },
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
});

export default i18n;
