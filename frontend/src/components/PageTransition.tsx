import { useRef, useEffect, useCallback, useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import gsap from "gsap";

export default function PageTransition() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitioning, setTransitioning] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  const fillRef = useRef<SVGRectElement>(null);

  const runTransition = useCallback(async () => {
    const path1 = path1Ref.current;
    const path2 = path2Ref.current;
    const fill = fillRef.current;
    if (!path1 || !path2 || !fill) return;

    setTransitioning(true);

    // Measure paths
    const len1 = path1.getTotalLength();
    const len2 = path2.getTotalLength();

    // Set initial dash state
    gsap.set([path1, path2], { strokeDasharray: len1, strokeDashoffset: len1, opacity: 1 });
    gsap.set(fill, { opacity: 0 });

    const tl = gsap.timeline();

    // Phase 1: draw strokes across screen
    tl.to(path1, {
      strokeDashoffset: 0,
      duration: 0.5,
      ease: "power2.inOut",
    })
    .to(path2, {
      strokeDashoffset: 0,
      duration: 0.4,
      ease: "power2.inOut",
    }, "-=0.35")
    // Phase 2: fill screen with color
    .to(fill, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.in",
    })
    // Phase 3: switch content
    .call(() => {
      setDisplayLocation(location);
    })
    // Phase 4: wipe away
    .to(fill, {
      opacity: 0,
      duration: 0.15,
      ease: "power2.out",
    })
    .to([path1, path2], {
      strokeDashoffset: -len1,
      duration: 0.55,
      ease: "power3.in",
      stagger: 0.05,
    })
    .call(() => {
      gsap.set([path1, path2], { opacity: 0, strokeDashoffset: len1 });
      setTransitioning(false);
    });
  }, [location]);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      runTransition();
    }
  }, [location, displayLocation, runTransition]);

  return (
    <>
      {/* SVG overlay */}
      <svg
        ref={svgRef}
        className={`page-transition-svg ${transitioning ? "active" : ""}`}
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="strokeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="strokeGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>

        {/* Background fill */}
        <rect
          ref={fillRef}
          x="0" y="0" width="1440" height="900"
          fill="#0d0d12"
          opacity="0"
        />

        {/* Hand-drawn bezier stroke 1 — sweeping top-left to bottom-right */}
        <path
          ref={path1Ref}
          d="M -50,200 C 180,80 320,320 500,280 C 720,230 680,450 850,480 C 1020,510 1100,300 1280,380 C 1380,420 1480,500 1520,550"
          fill="none"
          stroke="url(#strokeGrad1)"
          strokeWidth="120"
          strokeLinecap="round"
          opacity="0"
        />

        {/* Hand-drawn bezier stroke 2 — sweeping bottom-left to top-right */}
        <path
          ref={path2Ref}
          d="M -30,750 C 200,820 350,600 550,640 C 780,685 720,380 900,350 C 1060,320 1180,500 1350,420 C 1420,390 1490,300 1530,250"
          fill="none"
          stroke="url(#strokeGrad2)"
          strokeWidth="100"
          strokeLinecap="round"
          opacity="0"
        />
      </svg>

      {/* Page content */}
      <Outlet />
    </>
  );
}
