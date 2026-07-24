"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageToggle } from "@/i18n/LanguageToggle";
import styles from "./news.module.css";

export default function NewsPage() {
  const { t } = useLanguage();

  return (
    <div className={styles.newsContainer}>
      {/* Navigation Bar */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <Link href="/" className={styles.brand}>
            <Image src="/logo.png" alt="Vibe Connect Logo" width={36} height={36} className={styles.brandLogoImg} />
            <span>Vibe Connect</span>
          </Link>

          <div className={styles.navActions}>
            <LanguageToggle />
            <Link href="/" className={styles.backBtn}>
              ← {t("news.backToHome")}
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.badge}>
            <span className={styles.badgeSpark}>⚡</span>
            <span>RELEASE LOGS & UPDATES</span>
          </div>
          <h1 className={styles.title}>{t("news.title")}</h1>
          <p className={styles.subtitle}>{t("news.subtitle")}</p>
        </header>

        {/* Release Timeline List */}
        <div className={styles.timeline}>
          {/* Release Entry 1 (v2.0.0) */}
          <article className={styles.releaseCard}>
            <div className={styles.releaseHeader}>
              <span className={styles.dateTag}>{t("news.date1")}</span>
              <span className={styles.latestPill}>{t("news.latestBadge")}</span>
            </div>
            <h2 className={styles.releaseTitle}>{t("news.v2Title")}</h2>
            <ul className={styles.featureList}>
              <li>{t("news.v2_feat1")}</li>
              <li>{t("news.v2_feat2")}</li>
              <li>{t("news.v2_feat3")}</li>
              <li>{t("news.v2_feat4")}</li>
            </ul>
          </article>

          {/* Release Entry 2 (v1.5.0) */}
          <article className={styles.releaseCard}>
            <div className={styles.releaseHeader}>
              <span className={styles.dateTag}>{t("news.date2")}</span>
            </div>
            <h2 className={styles.releaseTitle}>{t("news.v1_5Title")}</h2>
            <ul className={styles.featureList}>
              <li>{t("news.v1_5_feat1")}</li>
              <li>{t("news.v1_5_feat2")}</li>
              <li>{t("news.v1_5_feat3")}</li>
            </ul>
          </article>

          {/* Release Entry 3 (v1.0.0) */}
          <article className={styles.releaseCard}>
            <div className={styles.releaseHeader}>
              <span className={styles.dateTag}>{t("news.date3")}</span>
            </div>
            <h2 className={styles.releaseTitle}>{t("news.v1_0Title")}</h2>
            <ul className={styles.featureList}>
              <li>{t("news.v1_0_feat1")}</li>
              <li>{t("news.v1_0_feat2")}</li>
            </ul>
          </article>
        </div>
      </main>
    </div>
  );
}
