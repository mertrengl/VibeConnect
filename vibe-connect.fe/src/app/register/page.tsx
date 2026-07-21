"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password Validation Rules (6 items for 3x2 perfectly symmetric grid)
  const rules = {
    min8Chars: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[\W_]/.test(password),
    passwordsMatch: password.length > 0 && password === confirmPassword,
  };

  const isFormValid =
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    rules.min8Chars &&
    rules.hasUppercase &&
    rules.hasLowercase &&
    rules.hasNumber &&
    rules.hasSymbol &&
    rules.passwordsMatch &&
    termsAgreed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError(null);
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Kayıt olunurken bir hata oluştu."
        );
      }

      setSuccess(true);

      // Auto redirect to login after short delay
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Sunucuya bağlanılamadı. Lütfen API servisinizin çalıştığından emin olun.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.ambientGlow}></div>

      <div className={styles.registerCard}>
        <div className={styles.registerHeader}>
          <div className={styles.registerLogoBox}>
            <Image
              src="/logo.png"
              alt="Vibe Connect Logo"
              width={32}
              height={32}
              className={styles.logoImg}
            />
          </div>
          <h1 className={styles.registerTitle}>Vibe Connect</h1>
          <p className={styles.subtitle}>Create your secure workspace account.</p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && (
          <div className={styles.successMessage}>
            Hesabınız başarıyla oluşturuldu! Giriş sayfasına yönlendiriliyorsunuz...
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.registerForm}>
          {/* Username Field */}
          <div className={styles.registerInputGroup}>
            <label className={styles.label}>Username</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <input
                type="text"
                placeholder="janedoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={styles.registerInput}
                required
              />
            </div>
          </div>

          {/* Email Field */}
          <div className={styles.registerInputGroup}>
            <label className={styles.label}>Work Email</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </span>
              <input
                type="email"
                placeholder="jane@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.registerInput}
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className={styles.registerInputGroup}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.registerInput}
                required
              />
              <button
                type="button"
                className={styles.togglePasswordBtn}
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className={styles.registerInputGroup}>
            <label className={styles.label}>Confirm Password</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.registerInput}
                required
              />
            </div>
          </div>

          {/* Live Password Rules Checklist (Symmetric 3x2 Grid) */}
          <div className={styles.passwordChecklist}>
            <div className={`${styles.checkItem} ${rules.min8Chars ? styles.checkItemPassed : ""}`}>
              <span className={`${styles.checkIcon} ${rules.min8Chars ? styles.checkIconPassed : styles.checkIconPending}`}>
                {rules.min8Chars ? "✓" : "○"}
              </span>
              <span>8+ characters</span>
            </div>

            <div className={`${styles.checkItem} ${rules.hasUppercase ? styles.checkItemPassed : ""}`}>
              <span className={`${styles.checkIcon} ${rules.hasUppercase ? styles.checkIconPassed : styles.checkIconPending}`}>
                {rules.hasUppercase ? "✓" : "○"}
              </span>
              <span>Uppercase (A-Z)</span>
            </div>

            <div className={`${styles.checkItem} ${rules.hasLowercase ? styles.checkItemPassed : ""}`}>
              <span className={`${styles.checkIcon} ${rules.hasLowercase ? styles.checkIconPassed : styles.checkIconPending}`}>
                {rules.hasLowercase ? "✓" : "○"}
              </span>
              <span>Lowercase (a-z)</span>
            </div>

            <div className={`${styles.checkItem} ${rules.hasNumber ? styles.checkItemPassed : ""}`}>
              <span className={`${styles.checkIcon} ${rules.hasNumber ? styles.checkIconPassed : styles.checkIconPending}`}>
                {rules.hasNumber ? "✓" : "○"}
              </span>
              <span>Number (0-9)</span>
            </div>

            <div className={`${styles.checkItem} ${rules.hasSymbol ? styles.checkItemPassed : ""}`}>
              <span className={`${styles.checkIcon} ${rules.hasSymbol ? styles.checkIconPassed : styles.checkIconPending}`}>
                {rules.hasSymbol ? "✓" : "○"}
              </span>
              <span>Special symbol (!@#)</span>
            </div>

            <div className={`${styles.checkItem} ${rules.passwordsMatch ? styles.checkItemPassed : ""}`}>
              <span className={`${styles.checkIcon} ${rules.passwordsMatch ? styles.checkIconPassed : styles.checkIconPending}`}>
                {rules.passwordsMatch ? "✓" : "○"}
              </span>
              <span>Passwords match</span>
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="terms"
              checked={termsAgreed}
              onChange={(e) => setTermsAgreed(e.target.checked)}
              className={styles.checkbox}
              required
            />
            <label htmlFor="terms" className={styles.checkboxLabel}>
              I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className={styles.registerSubmitBtn}
          >
            {loading ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>Create Account</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </>
            )}
          </button>
        </form>

        <div className={styles.footerText} style={{ marginTop: 12 }}>
          Already have an account?
          <Link href="/login" className={styles.footerLink}>
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
