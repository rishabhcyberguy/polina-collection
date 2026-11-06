import { ArrowLeft, Shield, Lock, Eye, FileText, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { SiteHeader, SiteFooter, usePageMeta } from "@/components/PolinaLayout";
import { DEFAULT_SITE_CONTENT } from "@/lib/site-content";

export default function PrivacyPolicy() {
  usePageMeta(
    "Privacy Policy — POLINA",
    "Learn how POLINA protects your data, safeguards editorial sessions, and adheres to strict privacy principles."
  );

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="privacy-page" style={{ padding: "clamp(60px, 8vw, 120px) clamp(24px, 6vw, 96px)", maxWidth: "1100px", margin: "0 auto" }}>
        <Link href="/" className="back-link" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: "32px", color: "var(--ink)" }}>
          <ArrowLeft size={14} /> Back to POLINA
        </Link>

        <header style={{ marginBottom: "56px", borderBottom: "1px solid var(--line)", paddingBottom: "32px" }}>
          <span className="mono-label" style={{ display: "block", marginBottom: "12px", color: "var(--red)" }}>
            LEGAL / DATA GOVERNANCE
          </span>
          <h1 style={{ fontFamily: "Barlow Condensed, Impact, sans-serif", fontSize: "clamp(48px, 8vw, 84px)", fontWeight: 900, textTransform: "uppercase", lineHeight: 0.9, letterSpacing: "-0.03em", margin: "0 0 16px" }}>
            Privacy<br /><em>Policy.</em>
          </h1>
          <p style={{ maxWidth: "600px", fontSize: "15px", lineHeight: 1.65, color: "#5a564f", margin: 0 }}>
            At POLINA, we respect your personal boundaries and uphold zero-trust privacy standards across our fashion commerce catalog and editorial features.
          </p>
          <div style={{ display: "flex", gap: "24px", marginTop: "24px", fontFamily: "DM Mono, monospace", fontSize: "10px", color: "#8a847c", textTransform: "uppercase" }}>
            <span>EFFECTIVE: NOVEMBER 2026</span>
            <span>·</span>
            <span>VERSION 1.4 (ENCRYPTED)</span>
          </div>
        </header>

        <section style={{ display: "grid", gap: "48px" }}>
          <article style={{ display: "grid", gridTemplateColumns: "clamp(180px, 22vw, 260px) 1fr", gap: "32px", alignItems: "start" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--red)", marginBottom: "8px" }}>
                <Shield size={16} />
                <span className="mono-label" style={{ color: "var(--red)" }}>SECTION 01</span>
              </div>
              <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "28px", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>
                Information We Collect
              </h2>
            </div>
            <div style={{ color: "#3a3733", fontSize: "14px", lineHeight: 1.7, display: "grid", gap: "14px" }}>
              <p>
                We minimize data acquisition. When you browse the POLINA collection, we do not perform invasive fingerprinting or sell your telemetry. We only collect information strictly required for core functionality:
              </p>
              <ul style={{ paddingLeft: "20px", display: "grid", gap: "8px" }}>
                <li><strong>Catalog Browsing:</strong> Standard non-identifying HTTP request headers, timestamps, and referral paths to optimize page load speeds.</li>
                <li><strong>Contact Inquiries:</strong> Voluntarily submitted names, contact emails, and inquiry contents when you request bespoke editorial pieces.</li>
                <li><strong>Administrative Authentication:</strong> Secure OAuth tokens or cryptographically salted credentials used exclusively for authorized store management.</li>
              </ul>
            </div>
          </article>

          <article style={{ display: "grid", gridTemplateColumns: "clamp(180px, 22vw, 260px) 1fr", gap: "32px", alignItems: "start", borderTop: "1px solid var(--line)", paddingTop: "40px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--red)", marginBottom: "8px" }}>
                <Lock size={16} />
                <span className="mono-label" style={{ color: "var(--red)" }}>SECTION 02</span>
              </div>
              <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "28px", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>
                Data Security &amp; Encryption
              </h2>
            </div>
            <div style={{ color: "#3a3733", fontSize: "14px", lineHeight: 1.7, display: "grid", gap: "14px" }}>
              <p>
                We employ comprehensive technical and organizational safeguards:
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginTop: "8px" }}>
                <div style={{ padding: "16px", background: "var(--paper)", border: "1px solid var(--line)" }}>
                  <strong style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>Anti-SQL Injection</strong>
                  <span style={{ fontSize: "12px", color: "#666" }}>100% parameterized ORM statements and structured document filters preventing SQL/NoSQL payload attacks.</span>
                </div>
                <div style={{ padding: "16px", background: "var(--paper)", border: "1px solid var(--line)" }}>
                  <strong style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>Rate Limiting</strong>
                  <span style={{ fontSize: "12px", color: "#666" }}>Automated API threshold monitoring and brute-force throttling across all endpoints.</span>
                </div>
                <div style={{ padding: "16px", background: "var(--paper)", border: "1px solid var(--line)" }}>
                  <strong style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>XSS Sanitization</strong>
                  <span style={{ fontSize: "12px", color: "#666" }}>Strict DOMPurify sanitization and Zod type-safe validations on all incoming payloads.</span>
                </div>
              </div>
            </div>
          </article>

          <article style={{ display: "grid", gridTemplateColumns: "clamp(180px, 22vw, 260px) 1fr", gap: "32px", alignItems: "start", borderTop: "1px solid var(--line)", paddingTop: "40px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--red)", marginBottom: "8px" }}>
                <Eye size={16} />
                <span className="mono-label" style={{ color: "var(--red)" }}>SECTION 03</span>
              </div>
              <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "28px", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>
                Cookies &amp; Local Storage
              </h2>
            </div>
            <div style={{ color: "#3a3733", fontSize: "14px", lineHeight: 1.7, display: "grid", gap: "14px" }}>
              <p>
                We do NOT deploy invasive cross-site advertising cookies or sell telemetry to third-party data brokers.
              </p>
              <p>
                We use strictly necessary first-party session cookies and local tokens with <code>SameSite=Lax</code> and <code>HttpOnly</code> flags solely to sustain your active administrative session and verify CSRF protection tokens.
              </p>
            </div>
          </article>

          <article style={{ display: "grid", gridTemplateColumns: "clamp(180px, 22vw, 260px) 1fr", gap: "32px", alignItems: "start", borderTop: "1px solid var(--line)", paddingTop: "40px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--red)", marginBottom: "8px" }}>
                <FileText size={16} />
                <span className="mono-label" style={{ color: "var(--red)" }}>SECTION 04</span>
              </div>
              <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "28px", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>
                Your Privacy Rights
              </h2>
            </div>
            <div style={{ color: "#3a3733", fontSize: "14px", lineHeight: 1.7, display: "grid", gap: "14px" }}>
              <p>
                Under global privacy legislation including GDPR and CCPA, you retain full sovereignty over your data:
              </p>
              <ul style={{ paddingLeft: "20px", display: "grid", gap: "6px" }}>
                <li>Right to inspect and access any personal record stored in connection with your identity.</li>
                <li>Right to demand prompt correction of inaccurate records.</li>
                <li>Right to immediate and total erasure ("Right to Be Forgotten").</li>
                <li>Right to restriction of processing and data portability.</li>
              </ul>
              <p style={{ marginTop: "12px" }}>
                To exercise any privacy right, contact our Data Governance Officer directly at <code>privacy@polina.com</code>.
              </p>
            </div>
          </article>
        </section>

        <div style={{ marginTop: "64px", padding: "28px", background: "var(--paper)", border: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#228b22", fontWeight: 700, fontSize: "13px", marginBottom: "4px" }}>
              <CheckCircle2 size={16} /> Zero Data Selling Guarantee
            </div>
            <span style={{ fontSize: "12px", color: "#666" }}>POLINA never monetizes customer profiles or shares behavioral records.</span>
          </div>
          <Link href="/collections" className="button-red">
            Explore Collection
          </Link>
        </div>
      </main>
      <SiteFooter note={DEFAULT_SITE_CONTENT.footerNote} contactLinks={DEFAULT_SITE_CONTENT.contactLinks} />
    </div>
  );
}
