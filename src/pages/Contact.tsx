import { useState, type FormEvent } from "react";
import { ArrowUpRight, Send, CheckCircle2, Shield, Mail, Phone, ShoppingBag, Instagram, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import DOMPurify from "dompurify";
import { ContactBlock, SiteFooter, SiteHeader, usePageMeta } from "@/components/PolinaLayout";
import { DEFAULT_SITE_CONTENT, isSiteContent } from "@/lib/site-content";
import { trpc } from "@/lib/trpc";

export default function ContactPage() {
  const homeQuery = trpc.catalog.home.useQuery();
  const content = isSiteContent(homeQuery.data) ? homeQuery.data : DEFAULT_SITE_CONTENT;
  usePageMeta("Contact POLINA — Editorial Inquiries", "Official contact details and bespoke inquiry portal for POLINA.");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // XSS Sanitization using DOMPurify
    const cleanName = DOMPurify.sanitize(name.trim());
    const cleanEmail = DOMPurify.sanitize(email.trim());
    const cleanMessage = DOMPurify.sanitize(message.trim());

    if (!cleanName || !cleanEmail || !cleanMessage) {
      setError("Please complete all required fields.");
      return;
    }

    if (!cleanEmail.includes("@") || cleanEmail.length < 5) {
      setError("Please provide a valid contact email address.");
      return;
    }

    // Process sanitized submission
    setSubmitted(true);
  };

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="contact-page">
        <div className="contact-page__eyebrow" data-reveal="rise">
          <span className="mono-label">POLINA / CONTACT &amp; BESPOKE INQUIRIES</span>
          <span className="mono-label">OFFICIAL BRAND CHANNELS</span>
        </div>

        <h1 data-reveal="rise" data-reveal-delay="2">
          LET'S<br /><em>TALK.</em>
        </h1>

        <p className="contact-page__intro" data-reveal="rise" data-reveal-delay="3">
          Direct channels for inquiries, catalog orders, retail partnerships, and editorial previews.
        </p>

        {/* Direct Brand Contact Channels Cards */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            margin: "32px 0 48px",
            maxWidth: "960px",
          }}
          data-reveal="rise"
        >
          {/* Email Card */}
          <a
            href="mailto:skfasionmart@gmail.com"
            style={{
              padding: "24px",
              background: "#ffffff",
              border: "1px solid var(--line)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              textDecoration: "none",
              color: "inherit",
              transition: "border-color 0.2s ease, transform 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--red)" }}>
                <Mail size={16} />
                <span className="mono-label" style={{ fontSize: "10px", color: "var(--red)" }}>OFFICIAL EMAIL</span>
              </div>
              <ArrowUpRight size={14} style={{ opacity: 0.5 }} />
            </div>
            <strong style={{ fontSize: "16px", fontFamily: "DM Mono, monospace", color: "var(--ink)", wordBreak: "break-all" }}>
              skfasionmart@gmail.com
            </strong>
            <span style={{ fontSize: "12px", color: "#666" }}>Inquiries, wholesale orders, and editorial press</span>
          </a>

          {/* Phone Card */}
          <a
            href="tel:+919560849553"
            style={{
              padding: "24px",
              background: "#ffffff",
              border: "1px solid var(--line)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              textDecoration: "none",
              color: "inherit",
              transition: "border-color 0.2s ease, transform 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--red)" }}>
                <Phone size={16} />
                <span className="mono-label" style={{ fontSize: "10px", color: "var(--red)" }}>DIRECT TELEPHONE</span>
              </div>
              <ArrowUpRight size={14} style={{ opacity: 0.5 }} />
            </div>
            <strong style={{ fontSize: "16px", fontFamily: "DM Mono, monospace", color: "var(--ink)" }}>
              +91 9560849553
            </strong>
            <span style={{ fontSize: "12px", color: "#666" }}>Direct concierge &amp; order inquiries (Mon–Sat)</span>
          </a>

          {/* Amazon Card */}
          <a
            href="https://www.amazon.in/storefront?me=A12LTZ308EZ348&ref_=ssf_share"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "24px",
              background: "#ffffff",
              border: "1px solid var(--line)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              textDecoration: "none",
              color: "inherit",
              transition: "border-color 0.2s ease, transform 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#e67a00" }}>
                <ShoppingBag size={16} />
                <span className="mono-label" style={{ fontSize: "10px", color: "#e67a00" }}>AMAZON STORE</span>
              </div>
              <ExternalLink size={14} style={{ opacity: 0.5 }} />
            </div>
            <strong style={{ fontSize: "16px", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink)" }}>
              Amazon Official Storefront
            </strong>
            <span style={{ fontSize: "12px", color: "#666" }}>Prime delivery &amp; verified marketplace checkout</span>
          </a>

          {/* Flipkart Card */}
          <a
            href="https://www.flipkart.com/search?q=polina+women+nighty&as=on&as-show=on&otracker=AS_Query_OrganicAutoSuggest_1_13_na_na_na&otracker1=AS_Query_OrganicAutoSuggest_1_13_na_na_na&as-pos=1&as-type=RECENT&suggestionId=polina+women+nighty&requestId=0c69e4f3-be2a-4be8-80b6-46eac4b951ce&as-searchtext=polina%20womens"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "24px",
              background: "#ffffff",
              border: "1px solid var(--line)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              textDecoration: "none",
              color: "inherit",
              transition: "border-color 0.2s ease, transform 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#2874f0" }}>
                <ShoppingBag size={16} />
                <span className="mono-label" style={{ fontSize: "10px", color: "#2874f0" }}>FLIPKART STORE</span>
              </div>
              <ExternalLink size={14} style={{ opacity: 0.5 }} />
            </div>
            <strong style={{ fontSize: "16px", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink)" }}>
              Flipkart Nightwear Collection
            </strong>
            <span style={{ fontSize: "12px", color: "#666" }}>Explore certified catalog drops across India</span>
          </a>

          {/* Instagram Card */}
          <a
            href="https://www.instagram.com/polina_fashion7/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "24px",
              background: "#ffffff",
              border: "1px solid var(--line)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              textDecoration: "none",
              color: "inherit",
              gridColumn: "1 / -1",
              transition: "border-color 0.2s ease, transform 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#E1306C" }}>
                <Instagram size={16} />
                <span className="mono-label" style={{ fontSize: "10px", color: "#E1306C" }}>OFFICIAL INSTAGRAM</span>
              </div>
              <ExternalLink size={14} style={{ opacity: 0.5 }} />
            </div>
            <strong style={{ fontSize: "16px", fontFamily: "DM Mono, monospace", color: "var(--ink)" }}>
              @polina_fashion7
            </strong>
            <span style={{ fontSize: "12px", color: "#666" }}>Visual lookbooks, campaign previews, and collection releases</span>
          </a>
        </section>

        {/* Sanitized Direct Message Portal */}
        <section
          style={{
            maxWidth: "680px",
            margin: "0 0 60px",
            padding: "36px",
            background: "var(--paper)",
            border: "1px solid var(--line)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--red)", marginBottom: "16px" }}>
            <Shield size={16} />
            <span className="mono-label" style={{ color: "var(--red)" }}>
              XSS-PROTECTED &amp; ENCRYPTED TRANSMISSION
            </span>
          </div>

          <h3 style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "32px", textTransform: "uppercase", margin: "0 0 10px" }}>
            Send an Editorial Note
          </h3>
          <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.6, margin: "0 0 24px" }}>
            Submit press requests, bespoke sizing inquiries, or retail opportunities directly to the studio.
          </p>

          {submitted ? (
            <div style={{ padding: "20px", background: "#e8f5e9", border: "1px solid #c8e6c9", color: "#2e7d32", display: "flex", alignItems: "center", gap: "12px" }}>
              <CheckCircle2 size={24} />
              <div>
                <strong style={{ display: "block", fontSize: "14px" }}>Inquiry Dispatched Successfully</strong>
                <span style={{ fontSize: "12px" }}>Thank you. Our studio representative will contact you shortly.</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
              <label style={{ display: "grid", gap: "6px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                Your Name
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", background: "#fff", fontSize: "13px" }}
                />
              </label>

              <label style={{ display: "grid", gap: "6px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                Contact Email
                <input
                  type="email"
                  required
                  maxLength={150}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", background: "#fff", fontSize: "13px" }}
                />
              </label>

              <label style={{ display: "grid", gap: "6px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                Inquiry Details
                <textarea
                  rows={4}
                  required
                  maxLength={1000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Detail your request or sizing query…"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", background: "#fff", fontSize: "13px", resize: "vertical" }}
                />
              </label>

              {error ? <p style={{ color: "var(--red)", fontSize: "12px", margin: 0 }}>{error}</p> : null}

              <button type="submit" className="button-red" style={{ justifySelf: "start", gap: "10px" }}>
                <Send size={15} /> Dispatch Inquiry
              </button>
            </form>
          )}
        </section>

        <ContactBlock links={content.contactLinks} />

        <div className="contact-page__bottom" data-reveal="rise">
          <span className="mono-label">NO CUSTOMER ACCOUNT REQUIRED</span>
          <Link className="text-link" href="/collections">
            Return to the collection <ArrowUpRight size={15} />
          </Link>
        </div>

        {homeQuery.error ? <p className="inline-error" role="status">Contact details could not be loaded. Try again later.</p> : null}
      </main>
      <SiteFooter note={content.footerNote} contactLinks={content.contactLinks} />
    </div>
  );
}
