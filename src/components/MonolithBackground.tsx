import { useEffect, useRef } from "react";
import * as THREE from "three";

interface MonolithBackgroundProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function MonolithBackground({ className = "", style }: MonolithBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 720;

    // Scene setup with transparent background
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xf4f2ee, 0.025);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Studio lighting with architectural crimson & chrome contrast
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const redAccentLight = new THREE.DirectionalLight(0xe21e2b, 3.2);
    redAccentLight.position.set(12, 14, 12);
    scene.add(redAccentLight);

    const softFillLight = new THREE.DirectionalLight(0x444444, 1.5);
    softFillLight.position.set(-12, -8, 8);
    scene.add(softFillLight);

    // Create architectural 3D Monolith geometries
    const group = new THREE.Group();
    scene.add(group);

    const geometries = [
      new THREE.BoxGeometry(1.6, 5.2, 0.6),
      new THREE.BoxGeometry(3.6, 1.2, 0.8),
      new THREE.BoxGeometry(1.2, 3.4, 1.2),
      new THREE.BoxGeometry(4.2, 0.6, 0.6),
      new THREE.BoxGeometry(0.9, 4.5, 0.9),
    ];

    const materials = [
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.18, metalness: 0.85 }),
      new THREE.MeshStandardMaterial({ color: 0x1a1918, roughness: 0.35, metalness: 0.6 }),
      new THREE.MeshStandardMaterial({ color: 0xe21e2b, roughness: 0.25, metalness: 0.9, emissive: 0x330000 }),
      new THREE.MeshStandardMaterial({ color: 0x222220, roughness: 0.15, metalness: 0.95 }),
    ];

    const meshes: { mesh: THREE.Mesh; rotSpeed: { x: number; y: number; z: number }; floatSpeed: number; floatOffset: number }[] = [];

    for (let i = 0; i < 24; i++) {
      const geo = geometries[Math.floor(Math.random() * geometries.length)];
      const mat = materials[Math.floor(Math.random() * materials.length)];
      const mesh = new THREE.Mesh(geo, mat);

      mesh.position.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8 - 2
      );

      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      group.add(mesh);
      meshes.push({
        mesh,
        rotSpeed: {
          x: (Math.random() - 0.5) * 0.003,
          y: (Math.random() - 0.5) * 0.005,
          z: (Math.random() - 0.5) * 0.002,
        },
        floatSpeed: 0.5 + Math.random() * 0.8,
        floatOffset: Math.random() * Math.PI * 2,
      });
    }

    // Mouse parallax tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Resize handler
    let resizeRafId = 0;
    const handleResize = () => {
      if (resizeRafId) cancelAnimationFrame(resizeRafId);
      resizeRafId = requestAnimationFrame(() => {
        if (!container || !renderer || !camera) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || 720;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
    };
    window.addEventListener("resize", handleResize, { passive: true });

    // Animation loop
    let animationFrameId = 0;
    let clock = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      clock += 0.016;

      targetX += (mouseX - targetX) * 0.04;
      targetY += (mouseY - targetY) * 0.04;

      group.rotation.y = targetX * 0.35;
      group.rotation.x = -targetY * 0.35;

      meshes.forEach(({ mesh, rotSpeed, floatSpeed, floatOffset }) => {
        mesh.rotation.x += rotSpeed.x;
        mesh.rotation.y += rotSpeed.y;
        mesh.rotation.z += rotSpeed.z;
        mesh.position.y += Math.sin(clock * floatSpeed + floatOffset) * 0.003;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (resizeRafId) cancelAnimationFrame(resizeRafId);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`monolith-canvas-wrap ${className}`}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
        ...style,
      }}
    />
  );
}
