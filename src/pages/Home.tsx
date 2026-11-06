import { useEffect } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import LiquidText from "@/components/LiquidText";
import { CategoryIndex, ContactBlock, ProductRail, SiteFooter, SiteHeader, usePageMeta, type PublicProduct } from "@/components/PolinaLayout";
import { DEFAULT_SITE_CONTENT, isSiteContent, safeInternalTarget } from "@/lib/site-content";
import { trpc } from "@/lib/trpc";
import { initScrollAnimations } from "@/lib/animations";

export default function Home() {
  const homeQuery = trpc.catalog.home.useQuery();
  const productsQuery = trpc.catalog.products.useQuery({});
  const categoriesQuery = trpc.catalog.categories.useQuery();
  const content = isSiteContent(homeQuery.data) ? homeQuery.data : DEFAULT_SITE_CONTENT;
  const products = (productsQuery.data ?? []) as PublicProduct[];
  const selectedIds = content.featuredProductIds ?? [];
  const selectedProducts = selectedIds.map((id) => products.find((product) => product.id === id)).filter((product): product is PublicProduct => Boolean(product));
  const featured = (selectedIds.length ? selectedProducts : products.filter((product) => product.featured)).slice(0, 8);
  const placeholderHero = content.heroDescription.startsWith("Sample campaign copy");
  const placeholderStory = content.editorialBody.startsWith("Editable sample story");
  const homeError = homeQuery.error || productsQuery.error || categoriesQuery.error;
  usePageMeta("POLINA — Nightwear & Clothing", content.heroDescription);

  useEffect(() => {
    const timer = setTimeout(() => {
      initScrollAnimations();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section className="hero" aria-labelledby="hero-heading" style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center", padding: "0 clamp(24px, 6vw, 96px)" }}>
          {/* Hero Background Image (User Image 1) with darkened hand */}
          <div className="hero__bg-wrap" style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", overflow: "hidden" }}>
            <img
              src="/assets/aistudio/1_827c26c2.jpg"
              alt="POLINA editorial atmosphere"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center 40%",
                opacity: 0.88,
                mixBlendMode: "multiply",
                filter: "contrast(1.42) brightness(0.58) saturate(1.2)",
              }}
            />
            {/* Hand darkening emphasis overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(ellipse at 56% 50%, rgba(35, 26, 20, 0.38) 0%, rgba(35, 26, 20, 0.18) 45%, transparent 72%)",
                mixBlendMode: "multiply",
                pointerEvents: "none",
              }}
            />
            {/* Text readability fade on left side */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to right, rgba(244, 242, 238, 0.96) 0%, rgba(244, 242, 238, 0.75) 32%, rgba(244, 242, 238, 0.15) 58%, transparent 85%)",
                pointerEvents: "none",
              }}
            />
          </div>

          <span className="hero__split" aria-hidden="true" />
          <span className="hero__seam" aria-hidden="true" />
          <div className="hero__grain" aria-hidden="true" />

          <div className="hero__copy" data-reveal="rise" data-reveal-delay="2" style={{ position: "relative", zIndex: 3, maxWidth: "600px" }}>
            <span className="hero__eyebrow">{placeholderHero ? "SAMPLE CAMPAIGN · REPLACE BEFORE LAUNCH" : "POLINA / EDITORIAL"}</span>
            <h1 id="hero-heading" style={{ fontWeight: 900, color: "#000000", margin: "10px 0 16px" }}>
              <LiquidText text={content.heroHeading || "POLINA"} color="#000000" className="hero__liquid" />
            </h1>
            <p style={{ fontWeight: 500, color: "#1a1917" }}>{content.heroDescription}</p>
            <Link className="button-red" href={safeInternalTarget(content.heroCtaTarget)}>{content.heroCtaLabel || "Explore the collection"}<ArrowUpRight size={16} aria-hidden="true" /></Link>
          </div>

          <div className="hero__bottomline" data-reveal="rise" data-reveal-delay="3" style={{ position: "absolute", bottom: "25px", left: "clamp(22px, 4.2vw, 72px)", right: "clamp(22px, 4.2vw, 72px)", zIndex: 3, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "DM Mono", fontSize: "9px", letterSpacing: "0.13em", textTransform: "uppercase" }}>
            <span>WOMENSWEAR / EDITION 001</span>
            <a href="#featured" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>SCROLL TO DISCOVER <ArrowDown size={14} /></a>
            <span>EST. POLINA</span>
          </div>
          <span className="hero__side-note" aria-hidden="true">CONFIDENT · TACTILE · POLINA</span>
        </section>

        <section id="featured" className="section section-featured" data-reveal="rise">
          <div className="section-heading">
            <div><span className="mono-label">01 / THE EDIT</span><h2>Selected<br /><em>PRODUCTS</em></h2></div>
            <p className="section-intro">Published pieces from the POLINA collection.</p>
            <Link className="text-link" href="/collections">Shop all <ArrowUpRight size={15} /></Link>
          </div>
          {homeError ? <p className="inline-error" role="status">The catalog is temporarily unavailable. Please refresh in a moment.</p> : null}
          <ProductRail products={featured} />
        </section>

        <section id="categories" className="section section-categories" data-reveal="rise">
          <div className="category-intro"><span className="mono-label">02 / FIND YOUR FORM</span><h2>Find your<br /><span>own rhythm.</span></h2><p>Browse the collection by category. Categories are managed with the catalog.</p></div>
          <CategoryIndex categories={categoriesQuery.data ?? []} />
        </section>

        <section id="story" className="editorial-panel" style={{ opacity: 1, visibility: "visible" }}>
          <div
            className="editorial-panel__image"
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "460px",
              background: "#161514",
              padding: "clamp(32px, 5vw, 64px) clamp(24px, 4vw, 48px)",
              opacity: 1,
              clipPath: "none",
              visibility: "visible",
            }}
          >
            <span
              className="editorial-panel__stamp"
              style={{
                position: "absolute",
                top: "24px",
                left: "24px",
                zIndex: 3,
                color: "#f4f2ee",
                fontFamily: "DM Mono, monospace",
                fontSize: "10px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              P / 01 · ARCHITECTURAL FORM
            </span>

            {/* Architectural image in decent, small/refined size */}
            <div
              className="editorial-panel__photo-card"
              style={{
                position: "relative",
                zIndex: 2,
                width: "clamp(220px, 24vw, 300px)",
                aspectRatio: "3 / 4",
                maxHeight: "380px",
                overflow: "hidden",
                boxShadow: "0 24px 50px rgba(0, 0, 0, 0.75), 0 6px 16px rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                background: "#0c0b0a",
                opacity: 1,
                visibility: "visible",
              }}
            >
              <img
                src="/assets/aistudio/story-architecture.jpg"
                alt="POLINA Architectural Form"
                loading="eager"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                  display: "block",
                  opacity: 1,
                }}
              />
            </div>

            <span
              className="editorial-panel__word"
              aria-hidden="true"
              style={{
                position: "absolute",
                bottom: "14px",
                right: "20px",
                zIndex: 1,
                opacity: 0.18,
                pointerEvents: "none",
                color: "#ffffff",
                fontFamily: "Barlow Condensed, Impact, sans-serif",
                fontSize: "clamp(72px, 13vw, 150px)",
                fontWeight: 800,
                letterSpacing: "-0.06em",
                lineHeight: 0.7,
              }}
            >
              POLINA
            </span>
          </div>

          <div className="editorial-panel__copy" data-reveal="rise" data-reveal-delay="2">
            <span className="mono-label">{placeholderStory ? "03 / BRAND NOTE · SAMPLE CONTENT" : "03 / BRAND NOTE"}</span>
            <h2>{content.editorialHeading}</h2>
            <p>{content.editorialBody}</p>
            <Link className="text-link" href="/collections">Discover the edit <ArrowUpRight size={15} /></Link>
          </div>
        </section>

        {/* Bottom Banner with User Image 2 in Background */}
        <section className="bottom-banner" style={{ position: "relative", width: "100%", padding: "120px 0", overflow: "hidden", background: "#1a1917", color: "#f4f2ee" }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 0, opacity: 0.28, pointerEvents: "none" }}>
            <img src="/assets/aistudio/2.png_bcc2d9e2_2K_19548de1.jpg" alt="Background portrait art" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(100%) contrast(1.2)" }} />
          </div>
          <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "0 clamp(24px, 6vw, 96px)", textAlign: "center" }}>
            <span className="mono-label" style={{ color: "var(--red)", marginBottom: "16px", display: "inline-block" }}>04 / METAMORPHOSIS</span>
            <h2 style={{ fontFamily: "Barlow Condensed, Impact, sans-serif", fontSize: "clamp(48px, 7vw, 92px)", fontWeight: 900, textTransform: "uppercase", lineHeight: 0.9, margin: "0 0 24px", letterSpacing: "-0.03em" }}>POLINA collection</h2>
            <p style={{ maxWidth: "600px", margin: "0 auto 32px", fontSize: "16px", lineHeight: 1.6, color: "#d8d4cd" }}>Experience tactile expression and contemporary editorial silhouettes designed for uncompromising comfort and presence.</p>
            <Link className="button-red" href="/collections">Explore the drop <ArrowUpRight size={16} /></Link>
          </div>
        </section>

        <ContactBlock links={content.contactLinks} />
      </main>
      <SiteFooter note={content.footerNote} contactLinks={content.contactLinks} />
    </div>
  );
}
