import { useEffect, useState } from "react";

export default function TilesLoader() {
  const [percent, setPercent] = useState(0);
  const [phase, setPhase] = useState<"loading" | "reveal" | "done">("loading");

  useEffect(() => {
    // Check if already shown in this session
    if (typeof window !== "undefined" && window.sessionStorage.getItem("polina_tile_loaded")) {
      setPhase("done");
      return;
    }

    const start = performance.now();
    const duration = 1600; // 1.6s smooth loading

    const updateCounter = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.floor(eased * 100);
      setPercent(currentVal);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setPercent(100);
        setTimeout(() => {
          setPhase("reveal");
          setTimeout(() => {
            setPhase("done");
            try {
              window.sessionStorage.setItem("polina_tile_loaded", "true");
            } catch {}
          }, 650);
        }, 200);
      }
    };

    const animId = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(animId);
  }, []);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        pointerEvents: phase === "reveal" ? "none" : "auto",
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gridTemplateRows: "repeat(4, 1fr)",
        transition: "opacity 0.5s ease",
        opacity: phase === "reveal" ? 0 : 1,
      }}
    >
      {/* 24 grid tiles */}
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: "#121211",
            transform: phase === "reveal" ? "scale(0.85)" : "scale(1)",
            opacity: phase === "reveal" ? 0 : 1,
            transition: `transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${((i % 6) + Math.floor(i / 6)) * 30}ms, opacity 0.4s ease ${((i % 6) + Math.floor(i / 6)) * 30}ms`,
          }}
        />
      ))}

      {/* Center percentage counter & brand typography */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          color: "#f4f2ee",
          opacity: phase === "reveal" ? 0 : 1,
          transition: "opacity 0.3s ease",
        }}
      >
        <span
          className="mono-label"
          style={{
            color: "var(--red)",
            letterSpacing: "0.2em",
            marginBottom: "12px",
            fontSize: "11px",
            fontWeight: 700,
          }}
        >
          POLINA / STUDIOS
        </span>
        <div
          style={{
            fontFamily: "Barlow Condensed, Impact, sans-serif",
            fontSize: "clamp(64px, 14vw, 130px)",
            fontWeight: 900,
            lineHeight: 0.9,
            display: "inline-flex",
            alignItems: "baseline",
            letterSpacing: "-0.03em",
          }}
        >
          <span>{String(percent).padStart(2, "0")}</span>
          <span
            style={{
              fontSize: "0.4em",
              fontStyle: "italic",
              marginLeft: "6px",
              color: "var(--red)",
            }}
          >
            %
          </span>
        </div>
      </div>
    </div>
  );
}
