import { useState } from "react";
import { ArrowLeft, ArrowUpRight, ExternalLink, Maximize2, X } from "lucide-react";
import { Link, useRoute } from "wouter";
import { SiteFooter, SiteHeader, usePageMeta } from "@/components/PolinaLayout";
import { DEFAULT_SITE_CONTENT, isSiteContent } from "@/lib/site-content";
import { trpc } from "@/lib/trpc";
import { normalizeRetailerUrl } from "@shared/retailer";

const FALLBACK_IMAGE = "/assets/aistudio/DSC00916_copy_c03a84f5.jpg";

export default function ProductPage() {
  const [, params] = useRoute("/products/:slug");
  const slug = params?.slug ?? "";
  const productQuery = trpc.catalog.product.useQuery({ slug }, { enabled: Boolean(slug) });
  const homeQuery = trpc.catalog.home.useQuery();
  const product = productQuery.data;
  const content = isSiteContent(homeQuery.data) ? homeQuery.data : DEFAULT_SITE_CONTENT;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const productMetaTitle = product ? `${product.name} — POLINA` : productQuery.error ? "Product — POLINA" : "Product not found — POLINA";
  const productMetaDescription = product
    ? product.description || `${product.name} from POLINA.`
    : productQuery.error ? "This POLINA product is temporarily unavailable." : "This POLINA product is unavailable.";
  usePageMeta(productMetaTitle, productMetaDescription, !product, !productQuery.isLoading);

  const amazon = normalizeRetailerUrl(product?.amazonUrl ?? null, "amazon");
  const flipkart = normalizeRetailerUrl(product?.flipkartUrl ?? null, "flipkart");

  const images = product?.images && product.images.length > 0
    ? product.images
    : [{ url: FALLBACK_IMAGE, altText: product?.name || "POLINA piece" }];

  const activeImage = images[activeImageIndex] || images[0];

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="product-page">
        <div className="catalog-page__top">
          <Link href="/collections" className="back-link">
            <ArrowLeft size={14} /> Back to collection
          </Link>
          <span className="mono-label">POLINA / {product?.categoryName || "PRODUCT"}</span>
        </div>

        {productQuery.isLoading ? (
          <div className="loading-line" style={{ padding: "80px 0", textAlign: "center" }}>
            <span className="mono-label">LOADING PIECE…</span>
          </div>
        ) : product ? (
          <div className="product-detail" style={{ opacity: 1, visibility: "visible" }}>
            {/* Left: Product Gallery */}
            <div className="product-detail__gallery-wrapper">
              <div className="product-detail__main-image-frame" style={{ position: "relative", background: "#eae7e1", overflow: "hidden", minHeight: "440px" }}>
                <img
                  key={activeImage.url}
                  src={imageErrors[activeImageIndex] ? FALLBACK_IMAGE : activeImage.url}
                  alt={activeImage.altText || product.name}
                  fetchPriority="high"
                  loading="eager"
                  onError={() => handleImageError(activeImageIndex)}
                  style={{
                    width: "100%",
                    height: "auto",
                    maxHeight: "820px",
                    objectFit: "contain",
                    display: "block",
                    transition: "opacity 0.25s ease",
                  }}
                />

                <span className="product-detail__badge mono-label" style={{ position: "absolute", bottom: "16px", left: "16px", padding: "6px 10px", background: "rgba(244, 242, 238, 0.94)", backdropFilter: "blur(8px)", fontSize: "9px" }}>
                  IMAGE {String(activeImageIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
                </span>

                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="product-detail__zoom-btn"
                  title="View full resolution"
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    width: "36px",
                    height: "36px",
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(244, 242, 238, 0.88)",
                    border: "1px solid #d8d4cd",
                    cursor: "pointer",
                    color: "var(--ink)",
                    transition: "background 0.2s ease",
                  }}
                >
                  <Maximize2 size={16} />
                </button>
              </div>

              {/* Thumbnails strip */}
              {images.length > 1 && (
                <div className="product-detail__thumbs" style={{ display: "flex", gap: "10px", marginTop: "14px", overflowX: "auto" }}>
                  {images.map((img, idx) => (
                    <button
                      key={`${img.url}-${idx}`}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      style={{
                        position: "relative",
                        width: "80px",
                        height: "100px",
                        padding: 0,
                        border: idx === activeImageIndex ? "2px solid #000000" : "1px solid #d8d4cd",
                        background: "#eae7e1",
                        cursor: "pointer",
                        overflow: "hidden",
                        flexShrink: 0,
                        opacity: idx === activeImageIndex ? 1 : 0.65,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <img
                        src={imageErrors[idx] ? FALLBACK_IMAGE : img.url}
                        alt={`Thumbnail ${idx + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Editorial Information */}
            <article className="product-detail__copy">
              <span className="mono-label" style={{ color: "var(--red)", letterSpacing: "0.14em" }}>
                {product.categoryName} / {product.featured ? "FEATURED DROP" : "EDITION 001"}
              </span>

              <h1 style={{ fontFamily: "Barlow Condensed, Impact, sans-serif", fontSize: "clamp(52px, 7vw, 92px)", fontWeight: 900, textTransform: "uppercase", lineHeight: 0.86, margin: "16px 0 20px", color: "#000000" }}>
                {product.name}<span className="red-dot">.</span>
              </h1>

              <div style={{ display: "inline-block", padding: "4px 10px", background: "#1a1917", color: "#f4f2ee", fontFamily: "DM Mono, monospace", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "22px" }}>
                AUTUMN / WINTER EDITORIAL SPEC
              </div>

              <p className="product-detail__description" style={{ fontSize: "16px", lineHeight: 1.75, color: "#2d2a26", maxWidth: "480px" }}>
                {product.description}
              </p>

              <div className="product-detail__specs" style={{ margin: "28px 0", borderTop: "1px solid #d8d4cd", borderBottom: "1px solid #d8d4cd", padding: "18px 0" }}>
                <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "10px", fontSize: "12px", marginBottom: "10px" }}>
                  <span className="mono-label" style={{ color: "#77716b" }}>MATERIAL</span>
                  <span style={{ fontWeight: 600 }}>Tactile Velour Fleece · Deep Obsidian</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "10px", fontSize: "12px", marginBottom: "10px" }}>
                  <span className="mono-label" style={{ color: "#77716b" }}>SILHOUETTE</span>
                  <span style={{ fontWeight: 600 }}>Relaxed High-Collar · Dropped Shoulders</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "10px", fontSize: "12px" }}>
                  <span className="mono-label" style={{ color: "#77716b" }}>CARE</span>
                  <span style={{ fontWeight: 600 }}>Cold Gentle Wash · Dry Flat</span>
                </div>
              </div>

              <div className="retailer-actions" style={{ display: "flex", gap: "12px", flexWrap: "wrap", margin: "24px 0 12px" }}>
                {amazon && (
                  <a className="button-red" href={amazon} target="_blank" rel="noopener noreferrer">
                    Shop on Amazon <ExternalLink size={15} aria-hidden="true" />
                  </a>
                )}
                {flipkart && (
                  <a className="button-outline" href={flipkart} target="_blank" rel="noopener noreferrer">
                    Shop on Flipkart <ExternalLink size={15} aria-hidden="true" />
                  </a>
                )}
                {!amazon && !flipkart && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 18px", border: "1px solid #000000", background: "#000000", color: "#ffffff", fontFamily: "DM Mono, monospace", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    EDITORIAL ITEM · CONTACT FOR ORDERS
                  </div>
                )}
              </div>

              <p className="retailer-note" style={{ color: "#77716b", fontSize: "11px", margin: "10px 0 24px" }}>
                Authentic POLINA studio pieces with verified editorial styling.
              </p>

              <Link className="text-link" href={`/category/${encodeURIComponent(product.categorySlug)}`}>
                More in {product.categoryName} <ArrowUpRight size={15} />
              </Link>
            </article>
          </div>
        ) : (
          <div className="catalog-empty">
            <span className="mono-label">404 / NOT IN THE COLLECTION</span>
            <h1>That piece isn't here.</h1>
            <p>This product may have been unpublished or the link may be incorrect.</p>
            <Link href="/collections" className="text-link">
              Browse published pieces <ArrowUpRight size={15} />
            </Link>
          </div>
        )}

        {productQuery.error && (
          <p className="inline-error" role="status">
            This product could not be loaded. Refresh the page to try again.
          </p>
        )}

        {/* Lightbox / Zoom Dialog */}
        {lightboxOpen && (
          <div
            onClick={() => setLightboxOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(0, 0, 0, 0.92)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              cursor: "zoom-out",
            }}
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              style={{
                position: "absolute",
                top: "24px",
                right: "24px",
                color: "#ffffff",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <X size={28} />
            </button>
            <img
              src={imageErrors[activeImageIndex] ? FALLBACK_IMAGE : activeImage.url}
              alt={activeImage.altText || product?.name || "Zoomed view"}
              style={{
                maxWidth: "92vw",
                maxHeight: "92vh",
                objectFit: "contain",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              }}
            />
          </div>
        )}

        <SiteFooter note={content.footerNote} contactLinks={content.contactLinks} />
      </main>
    </div>
  );
}
