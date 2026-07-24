"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageToggle } from "@/i18n/LanguageToggle";
import styles from "./page.module.css";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className={styles.landingContainer}>
      {/* Navigation Header */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <Link href="/" className={styles.brand}>
            <Image
              src="/logo.png"
              alt="Vibe Connect Logo"
              width={36}
              height={36}
              className={styles.brandLogoImg}
            />
            <span>Vibe Connect</span>
          </Link>

          <div className={styles.navLinks}>
            <a href="#features" className={styles.navLink}>{t("landing.features")}</a>
            <a href="#about" className={styles.navLink}>{t("landing.about")}</a>
            <Link href="/news" className={styles.navLink}>{t("landing.updates")}</Link>
          </div>

          <div className={styles.navActions}>
            <LanguageToggle />
            <Link href="/login" className={styles.loginBtn}>{t("landing.logIn")}</Link>
            <Link href="/register" className={styles.getStartedBtn}>{t("landing.getStarted")}</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.ambientGlow}></div>

          <div className={styles.badge}>
            <span className={styles.badgeSpark}>⚡</span>
            <span>{t("landing.versionBadge")}</span>
          </div>

          <h1 className={styles.heroTitle}>
            {t("landing.heroTitleLine1")} <br />
            <span className={styles.heroTitleHighlight}>{t("landing.heroTitleHighlight")}</span>
          </h1>

          <p className={styles.heroSubtitle}>
            {t("landing.heroSubtitle")}
          </p>

          <div className={styles.heroCtas}>
            <Link href="/register" style={{ width: '100%', maxWidth: '320px' }}>
              <button className={styles.heroPrimaryCta}>
                <span>{t("landing.heroCta")}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </Link>
          </div>

          {/* High Fidelity Live HTML UI Preview (No Images, Pure Interactive UI) */}
          <div className={styles.mockupContainer}>
            <div className={styles.liveUiWrapper}>
              {/* Left Sidebar Preview */}
              <div className={styles.liveSidebar}>
                <div className={styles.liveSidebarHeader}>
                  <Image src="/logo.png" alt="Logo" width={24} height={24} style={{ borderRadius: 6 }} />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>Vibe Connect</div>
                    <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)" }}>{t("landing.sidebarSub")}</div>
                  </div>
                </div>

                <div className={styles.liveJoinBtn}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(168,85,247,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    🌐
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>{t("common.joinPublicServers")}</div>
                    <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)" }}>{t("landing.publicServersSubtitle")}</div>
                  </div>
                </div>

                <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "8px 0" }}></div>

                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", padding: "4px 8px", textAlign: "left" }}>
                  💬 {t("common.directMessages")}
                </div>
                <div className={styles.liveUserItem}>
                  <div className={styles.liveUserAvatar}>A</div>
                  <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "#fff" }}>Alex Rivera</span>
                </div>
                <div className={styles.liveUserItem}>
                  <div className={styles.liveUserAvatar} style={{ background: "rgba(59,130,246,0.3)", color: "#60a5fa" }}>S</div>
                  <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "#fff" }}>Sarah Chen</span>
                </div>

                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", padding: "8px 8px 4px", textAlign: "left" }}>
                  👥 {t("common.myGroups")}
                </div>
                <div className={styles.liveUserItem}>
                  <div className={styles.liveUserAvatar} style={{ borderRadius: 6, background: "rgba(236,72,153,0.2)", color: "#f472b6" }}>#</div>
                  <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "#fff" }}>Dev Lounge 🌟</span>
                </div>
              </div>

              {/* Main Content Preview */}
              <div className={styles.liveMainContent}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ textAlign: "left" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", margin: 0 }}>{t("dashboard.exploreCommunitiesTitle")}</h3>
                    <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>{t("dashboard.exploreCommunitiesDesc")}</p>
                  </div>
                  <div style={{ background: "rgba(168,85,247,0.2)", color: "#c084fc", fontSize: "0.75rem", padding: "6px 12px", borderRadius: 8, fontWeight: 600 }}>
                    🌐 {t("dashboard.allTopics")}
                  </div>
                </div>

                {/* Live Bento Cards */}
                <div className={styles.liveBentoGrid}>
                  <div className={styles.liveCardFeatured}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #a855f7, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🌟</div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>#Global Hangout Lounge 🌟</div>
                        <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>2,840 active members</div>
                      </div>
                      <span style={{ marginLeft: "auto", background: "rgba(245,158,11,0.2)", color: "#fbbf24", fontSize: "0.68rem", padding: "4px 8px", borderRadius: 6, fontWeight: 600 }}>🔥 Hot</span>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", textAlign: "left", margin: "10px 0" }}>The primary community hub for meeting new friends, chatting about everything, and sharing daily vibes.</p>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <span className={styles.liveJoinServerBtn}>{t("dashboard.enterGroup")}</span>
                    </div>
                  </div>

                  <div className={styles.liveCard}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>🎮</div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#fff" }}>#Indie Game Devs 🎮</div>
                        <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>1,450 members</div>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.6)", textAlign: "left", margin: "8px 0" }}>Discuss Unreal Engine 5, pixel art & weekend party games.</p>
                    <span className={styles.liveJoinServerBtnOutline}>{t("dashboard.enterGroup")}</span>
                  </div>

                  <div className={styles.liveCard}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>💻</div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#fff" }}>#Full-Stack AI Devs 💻</div>
                        <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>1,890 members</div>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.6)", textAlign: "left", margin: "8px 0" }}>Next.js 16, NestJS, LLM agents & open-source project collabs.</p>
                    <span className={styles.liveJoinServerBtnOutline}>{t("dashboard.enterGroup")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature & Mission Grid */}
        <section id="features" className={styles.featuresSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t("landing.whyVibeConnect")}</h2>
            <p className={styles.sectionSubtitle}>
              {t("landing.whySubtitle")}
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {/* Slogan Mission 1 */}
            <div className={styles.featureCard}>
              <div className={styles.featureIconBox}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>{t("landing.feature1Title")}</h3>
              <p className={styles.featureDesc}>
                {t("landing.feature1Desc")}
              </p>
            </div>

            {/* Slogan Mission 2 */}
            <div className={styles.featureCard}>
              <div className={styles.featureIconBox}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>{t("landing.feature2Title")}</h3>
              <p className={styles.featureDesc}>
                {t("landing.feature2Desc")}
              </p>
            </div>

            {/* Slogan Mission 3 */}
            <div className={styles.featureCard}>
              <div className={styles.featureIconBox}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 8v4l3 3"></path>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>{t("landing.feature3Title")}</h3>
              <p className={styles.featureDesc}>
                {t("landing.feature3Desc")}
              </p>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className={styles.featuresSection} style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t("landing.aboutSectionTitle")}</h2>
            <p className={styles.sectionSubtitle}>
              {t("landing.aboutSectionSubtitle")}
            </p>
          </div>
          <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", padding: "24px 32px", background: "rgba(255,255,255,0.03)", borderRadius: "16px", border: "1px solid var(--color-border-subtle)", color: "var(--color-on-surface-variant)", lineHeight: 1.7, fontSize: "1.05rem" }}>
            {t("landing.aboutSectionDesc")}
          </div>
        </section>

        {/* Social Proof */}
        <section className={styles.socialProofSection}>
          <div className={styles.socialProofLabel}>{t("landing.trustedBy")}</div>
          <div className={styles.logosRow}>
            <div className={styles.logoIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12h12"/><path d="M6 7h12"/><path d="M6 17h12"/></svg>
              <span>APEX</span>
            </div>
            <div className={styles.logoIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              <span>VORTEX</span>
            </div>
            <div className={styles.logoIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 22 22 22 12 2"/></svg>
              <span>PRISM</span>
            </div>
            <div className={styles.logoIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              <span>NEXUS</span>
            </div>
            <div className={styles.logoIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m10 15 5-3-5-3v6Z"/></svg>
              <span>FLUX</span>
            </div>
          </div>
        </section>

        {/* CTA Banner Section */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaCard}>
            <h2 className={styles.ctaTitle}>{t("landing.readyToVibe")}</h2>
            <p className={styles.ctaDesc}>
              {t("landing.readyDesc")}
            </p>
            <Link href="/register">
              <button className={styles.ctaBtn}>{t("landing.getStartedNow")}</button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <Link href="/" className={styles.brand}>
            <Image
              src="/logo.png"
              alt="Vibe Connect Logo"
              width={28}
              height={28}
              className={styles.brandLogoImg}
            />
            <span style={{ fontSize: 16 }}>Vibe Connect</span>
          </Link>

          <div className={styles.footerLinks}>
            <a href="#" className={styles.footerLink}>{t("landing.privacyPolicy")}</a>
            <a href="#" className={styles.footerLink}>{t("landing.termsOfService")}</a>
            <a href="#" className={styles.footerLink}>{t("landing.cookiePolicy")}</a>
            <a href="#" className={styles.footerLink}>{t("landing.security")}</a>
          </div>

          <div className={styles.copyright}>
            {t("landing.copyright")}
          </div>
        </div>
      </footer>
    </div>
  );
}
