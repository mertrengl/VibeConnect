"use client";

import React from "react";
import { useLanguage } from "./LanguageContext";
import styles from "./LanguageToggle.module.css";

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={styles.toggleContainer} title="Switch Language / Dil Değiştir">
      <button
        onClick={() => setLanguage("tr")}
        className={`${styles.langBtn} ${language === "tr" ? styles.langBtnActive : ""}`}
        aria-label="Türkçe"
      >
        <span className={styles.flagIcon}>🇹🇷</span>
        <span>TR</span>
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={`${styles.langBtn} ${language === "en" ? styles.langBtnActive : ""}`}
        aria-label="English"
      >
        <span className={styles.flagIcon}>🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
};
