import { useRef, useEffect, useCallback, useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import gsap from "gsap";

export default function PageTransition() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitioning, setTransitioning] = useState(false);
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  const path3Ref = useRef<SVGPathElement>(null);
  const path4Ref = useRef<SVGPathElement>(null);
  const fillRef = useRef<SVGRectElement>(null);

  const runTransition = useCallback(async () => {
    const paths = [path1Ref.current, path2Ref.current, path3Ref.current, path4Ref.current].filter(Boolean) as SVGPathElement[];
    const fill = fillRef.current;
    if (paths.length === 0 || !fill) return;

    setTransitioning(true);

    const len = paths[0].getTotalLength();

    gsap.set(paths, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
    gsap.set(fill, { opacity: 0 });

    const tl = gsap.timeline();

    // Phase 1: draw all strokes on
    tl.to(paths, {
      strokeDashoffset: 0,
      duration: 0.5,
      ease: "power2.inOut",
      stagger: 0.08,
    })
    // Phase 2: fill to solid
    .to(fill, {
      opacity: 1,
      duration: 0.2,
      ease: "power2.in",
    })
    // Phase 3: switch content
    .call(() => {
      setDisplayLocation(location);
    })
    // Phase 4: wipe away
    .to(fill, {
      opacity: 0,
      duration: 0.1,
      ease: "power2.out",
    })
    .to(paths, {
      strokeDashoffset: -len,
      duration: 0.55,
      ease: "power3.in",
      stagger: 0.05,
    })
    .call(() => {
      gsap.set(paths, { opacity: 0, strokeDashoffset: len });
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
      <svg
        className={`page-transition-svg ${transitioning ? "active" : ""}`}
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="ptG1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="ptG2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
          <linearGradient id="ptG3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="ptG4" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#6d28d9" />
            <stop offset="100%" stopColor="#4338ca" />
          </linearGradient>
        </defs>

        <rect ref={fillRef} x="0" y="0" width="1440" height="900" fill="#0d0d12" opacity="0" />

        <path ref={path1Ref}
          d="M -200,-50 C 100,-20 250,200 400,150 C 600,80 550,350 750,400 C 950,450 1000,250 1200,350 C 1350,420 1500,550 1650,600"
          fill="none" stroke="url(#ptG1)" strokeWidth="280" strokeLinecap="round" opacity="0" />
        <path ref={path2Ref}
          d="M -200,950 C 150,880 300,650 500,680 C 700,710 650,400 850,350 C 1050,300 1150,550 1350,450 C 1450,390 1550,200 1650,100"
          fill="none" stroke="url(#ptG2)" strokeWidth="280" strokeLinecap="round" opacity="0" />
        <path ref={path3Ref}
          d="M -200,350 C 80,320 250,480 450,430 C 650,380 700,520 900,480 C 1100,440 1200,300 1400,350 C 1480,370 1580,430 1650,450"
          fill="none" stroke="url(#ptG3)" strokeWidth="260" strokeLinecap="round" opacity="0" />
        <path ref={path4Ref}
          d="M 1650,-50 C 1400,50 1350,250 1200,300 C 1000,370 1050,550 850,520 C 650,490 550,650 350,620 C 200,600 80,700 -200,750"
          fill="none" stroke="url(#ptG4)" strokeWidth="260" strokeLinecap="round" opacity="0" />
      </svg>

      <Outlet />
    </>
  );
}
