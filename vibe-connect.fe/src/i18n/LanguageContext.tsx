"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { trTranslations } from "./tr";
import { enTranslations } from "./en";

export type Language = "tr" | "en";

// Dictionary structure type inferred from TR translations
export type TranslationKeys = typeof trTranslations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (keyPath: string, fallbackMessage?: string) => string;
  getErrorMessage: (errorCode?: string, defaultMessage?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [language, setLanguageState] = useState<Language>("tr");

  useEffect(() => {
    const savedLang = localStorage.getItem("vibe_lang") as Language;
    if (savedLang === "tr" || savedLang === "en") {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("vibe_lang", lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === "tr" ? "en" : "tr";
    setLanguage(nextLang);
  };

  const translations = language === "tr" ? trTranslations : enTranslations;

  // Helper to resolve nested keys like "auth.loginTitle" or "errors.USER_NOT_FOUND"
  const t = (keyPath: string, fallbackMessage?: string): string => {
    const keys = keyPath.split(".");
    let current: any = translations;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        return fallbackMessage || keyPath;
      }
    }

    return typeof current === "string" ? current : fallbackMessage || keyPath;
  };

  // Helper to translate backend error codes
  const getErrorMessage = (errorCode?: string, defaultMessage?: string): string => {
    if (!errorCode) return defaultMessage || t("errors.INTERNAL_SERVER_ERROR");
    const translated = t(`errors.${errorCode}`);
    if (translated !== `errors.${errorCode}`) {
      return translated;
    }
    return defaultMessage || t("errors.INTERNAL_SERVER_ERROR");
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        getErrorMessage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
