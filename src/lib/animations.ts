import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function initScrollAnimations() {
  if (typeof window === "undefined") return;

  // Kill existing triggers to prevent duplication
  ScrollTrigger.getAll().forEach((t) => t.kill());

  // Hero section parallax: fades out and moves up as user scrolls down, stays visible when scrolled to top
  gsap.to(".hero__copy, .hero__bg-wrap", {
    y: -60,
    opacity: 0,
    ease: "power1.out",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom 35%",
      scrub: true,
    },
  });

  // Section reveals: appear on enter, disappear when scrolling down past section, do NOT disappear when scrolling up
  gsap.utils.toArray<HTMLElement>(".section, .editorial-panel, .bottom-banner").forEach((section) => {
    gsap.fromTo(
      section.querySelectorAll("[data-reveal='rise'], .section-heading, .category-intro, .editorial-panel__copy"),
      { y: 35, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.85,
        ease: "power2.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: section,
          start: "top 85%",
          end: "bottom 15%",
          // onEnter onLeave onEnterBack onLeaveBack
          // play on scroll down into view, reverse (disappear) on scroll down out of view,
          // play on scroll up into view, none (do not disappear) on scroll up past trigger
          toggleActions: "play reverse play none",
        },
      }
    );
  });
}
