import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
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
            <a href="#features" className={styles.navLink}>Features</a>
            <a href="#pricing" className={styles.navLink}>Pricing</a>
            <a href="#about" className={styles.navLink}>About</a>
            <a href="#developers" className={styles.navLink}>Developers</a>
          </div>

          <div className={styles.navActions}>
            <Link href="/login" className={styles.loginBtn}>Log In</Link>
            <Link href="/register" className={styles.getStartedBtn}>Get Started</Link>
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
            <span>Vibe Connect v2.0 is live</span>
          </div>

          <h1 className={styles.heroTitle}>
            Connect with Energy. <br />
            <span className={styles.heroTitleHighlight}>The real-time chat platform for modern teams.</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Experience seamless, deeply integrated communication designed for velocity and focus.
            Minimalist design, maximum output.
          </p>

          <div className={styles.heroCtas}>
            <Link href="/register" style={{ width: '100%', maxWidth: '320px' }}>
              <button className={styles.heroPrimaryCta}>
                <span>Start Chatting for Free</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </Link>
          </div>

          {/* High Fidelity App Preview Mockup Container */}
          <div className={styles.mockupContainer}>
            <Image
              src="/screen.png"
              alt="Vibe Connect App Preview"
              width={1200}
              height={700}
              className={styles.mockupImage}
              priority
            />
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className={styles.featuresSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Engineered for Velocity</h2>
            <p className={styles.sectionSubtitle}>
              Everything you need to keep your team in sync, without the noise.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {/* Feature 1 */}
            <div className={styles.featureCard}>
              <div className={styles.featureIconBox}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Real-time Sync</h3>
              <p className={styles.featureDesc}>
                Instantaneous message delivery across all your devices. Never miss a beat when moving from desktop to mobile.
              </p>
            </div>

            {/* Feature 2 */}
            <div className={styles.featureCard}>
              <div className={styles.featureIconBox}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>End-to-End Encryption</h3>
              <p className={styles.featureDesc}>
                Enterprise-grade security built into every conversation. Your ideas remain private and completely secure.
              </p>
            </div>

            {/* Feature 3 */}
            <div className={styles.featureCard}>
              <div className={styles.featureIconBox}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Customizable Workspaces</h3>
              <p className={styles.featureDesc}>
                Tailor your environment with flexible channels, deep integrations, and a focused dark-mode aesthetic.
              </p>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className={styles.socialProofSection}>
          <div className={styles.socialProofLabel}>TRUSTED BY OVER 10,000 TEAMS</div>
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
            <h2 className={styles.ctaTitle}>Ready to vibe?</h2>
            <p className={styles.ctaDesc}>
              Join thousands of teams already experiencing the future of focused, high-velocity communication.
            </p>
            <Link href="/register">
              <button className={styles.ctaBtn}>Get Started Now</button>
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
            <a href="#" className={styles.footerLink}>Privacy Policy</a>
            <a href="#" className={styles.footerLink}>Terms of Service</a>
            <a href="#" className={styles.footerLink}>Cookie Policy</a>
            <a href="#" className={styles.footerLink}>Security</a>
          </div>

          <div className={styles.copyright}>
            © 2024 Vibe Connect Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
