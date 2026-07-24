"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageToggle } from "@/i18n/LanguageToggle";
import styles from "./legal.module.css";

interface LegalPageProps {
  type: "privacy" | "terms" | "cookies" | "security";
}

export default function LegalDoc({ type }: LegalPageProps) {
  const { t } = useLanguage();

  const titleKey = `legal.${type}Title`;
  const subKey = `legal.${type}Sub`;
  const dateKey = `legal.${type}Date`;
  const content1Key = `legal.${type}Content1`;
  const content2Key = `legal.${type}Content2`;

  return (
    <div className={styles.legalContainer}>
      {/* Navbar Header */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <Link href="/" className={styles.brand}>
            <Image src="/logo.png" alt="Vibe Connect Logo" width={36} height={36} className={styles.brandLogoImg} />
            <span>Vibe Connect</span>
          </Link>

          <div className={styles.navActions}>
            <LanguageToggle />
            <Link href="/" className={styles.backBtn}>
              ← {t("legal.backToHome")}
            </Link>
          </div>
        </div>
      </nav>

      {/* Document Body */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.badge}>
            <span className={styles.badgeSpark}>🔒</span>
            <span>LEGAL & POLICY</span>
          </div>
          <h1 className={styles.title}>{t(titleKey)}</h1>
          <p className={styles.subtitle}>{t(subKey)}</p>
          <span className={styles.dateTag}>{t(dateKey)}</span>
        </header>

        <article className={styles.docCard}>
          <p className={styles.paragraph}>{t(content1Key)}</p>
          <p className={styles.paragraph}>{t(content2Key)}</p>
        </article>
      </main>
    </div>
  );
}
