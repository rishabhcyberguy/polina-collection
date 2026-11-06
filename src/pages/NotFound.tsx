import { ArrowLeft, ArrowUpRight, Compass, ShieldAlert } from "lucide-react";
import { Link, useLocation } from "wouter";
import { usePageMeta, SiteHeader, SiteFooter } from "@/components/PolinaLayout";
import { DEFAULT_SITE_CONTENT } from "@/lib/site-content";

export default function NotFound() {
  const [location] = useLocation();
  usePageMeta("404 — Page Not Found · POLINA", "The requested POLINA page or product could not be located.", true);

  return (
    <div className="site-shell">
      <SiteHeader />
      <main
        className="not-found-page"
        style={{
          minHeight: "75vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(60px, 10vw, 120px) clamp(24px, 6vw, 96px)",
          textAlign: "center",
          background: "var(--paper)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: "15%", right: "8%", opacity: 0.04, pointerEvents: "none", fontSize: "32vw", fontFamily: "Barlow Condensed, Impact, sans-serif", fontWeight: 900, lineHeight: 0.8 }}>
          404
        </div>

        <div style={{ position: "relative", zIndex: 2, maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", border: "1px solid var(--line)", background: "#fff", marginBottom: "24px" }}>
            <ShieldAlert size={14} style={{ color: "var(--red)" }} />
            <span className="mono-label" style={{ color: "var(--red)", fontSize: "10px" }}>
              404 / RESOURCE NOT LOCATED
            </span>
          </div>

          <h1
            style={{
              fontFamily: "Barlow Condensed, Impact, sans-serif",
              fontSize: "clamp(54px, 9vw, 108px)",
              fontWeight: 900,
              textTransform: "uppercase",
              lineHeight: 0.88,
              letterSpacing: "-0.04em",
              margin: "0 0 20px",
              color: "var(--ink)",
            }}
          >
            SILHOUETTE<br /><em>NOT FOUND.</em>
          </h1>

          <p style={{ fontSize: "15px", lineHeight: 1.65, color: "#5b5650", maxWidth: "480px", margin: "0 auto 28px" }}>
            The pathway you requested is unavailable or has been archived from the seasonal catalog.
          </p>

          <div style={{ margin: "0 auto 36px", padding: "8px 16px", background: "#eeece7", border: "1px solid #ddd9d2", fontFamily: "DM Mono, monospace", fontSize: "11px", color: "#666", display: "inline-block", maxWidth: "100%", overflowWrap: "break-word" }}>
            REQUESTED PATH: <code>{location}</code>
          </div>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/" className="button-red">
              <ArrowLeft size={16} /> Return to Homepage
            </Link>
            <Link href="/collections" className="button-outline">
              <Compass size={16} /> Explore All Pieces <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter note={DEFAULT_SITE_CONTENT.footerNote} contactLinks={DEFAULT_SITE_CONTENT.contactLinks} />
    </div>
  );
}
