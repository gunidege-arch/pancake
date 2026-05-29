import { useRef, useEffect, useCallback, useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import gsap from "gsap";

export default function PageTransition() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitioning, setTransitioning] = useState(false);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const fillRef = useRef<SVGRectElement>(null);

  const runTransition = useCallback(async () => {
    const paths = pathRefs.current.filter(Boolean) as SVGPathElement[];
    const fill = fillRef.current;
    if (paths.length === 0 || !fill) return;

    setTransitioning(true);

    const baseLen = paths[0].getTotalLength();

    gsap.set(paths, { strokeDasharray: baseLen, strokeDashoffset: baseLen, opacity: 1 });
    gsap.set(fill, { opacity: 0 });

    const tl = gsap.timeline();

    tl.to(paths, {
      strokeDashoffset: 0,
      duration: 0.65,
      ease: "power2.inOut",
      stagger: 0.04,
    })
    .to(fill, {
      opacity: 1,
      duration: 0.18,
      ease: "power2.in",
    })
    .call(() => {
      setDisplayLocation(location);
    })
    .to(fill, {
      opacity: 0,
      duration: 0.1,
      ease: "power2.out",
    })
    .to(paths, {
      strokeDashoffset: -baseLen,
      duration: 0.6,
      ease: "power3.in",
      stagger: 0.03,
    })
    .call(() => {
      gsap.set(paths, { opacity: 0, strokeDashoffset: baseLen });
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
          <linearGradient id="ptG4" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#6d28d9" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>

        <rect ref={fillRef} x="0" y="0" width="1440" height="900" fill="#0d0d12" opacity="0" />

        <path ref={(el) => { pathRefs.current[0] = el; }}
          d="M -60,120 C 180,40 300,280 520,200 C 740,120 680,380 880,440 C 1080,500 1180,300 1380,380 C 1500,420 1580,520 1640,560"
          fill="none" stroke="url(#ptG1)" strokeWidth="22" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[1] = el; }}
          d="M -40,780 C 200,840 340,580 560,620 C 780,660 700,340 920,310 C 1120,280 1200,540 1400,460 C 1500,400 1600,240 1660,180"
          fill="none" stroke="url(#ptG2)" strokeWidth="20" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[2] = el; }}
          d="M -80,400 C 140,350 280,520 480,460 C 680,400 720,560 940,510 C 1140,460 1220,380 1420,420 C 1540,450 1620,520 1680,550"
          fill="none" stroke="url(#ptG3)" strokeWidth="28" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[3] = el; }}
          d="M 1660,100 C 1380,180 1300,340 1120,300 C 920,260 980,480 780,520 C 580,560 480,380 280,430 C 160,460 60,590 -60,640"
          fill="none" stroke="url(#ptG4)" strokeWidth="18" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[4] = el; }}
          d="M 1660,700 C 1400,620 1340,440 1140,480 C 940,520 1000,680 800,650 C 620,620 520,760 320,720 C 180,690 60,790 -80,840"
          fill="none" stroke="url(#ptG1)" strokeWidth="24" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[5] = el; }}
          d="M -60,30 C 120,100 200,180 400,130 C 600,80 520,280 740,240 C 960,200 1000,340 1200,300 C 1400,260 1520,360 1660,320"
          fill="none" stroke="url(#ptG2)" strokeWidth="16" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[6] = el; }}
          d="M -60,900 C 160,800 280,650 480,700 C 680,750 600,550 820,510 C 1020,480 1100,620 1300,580 C 1460,550 1580,680 1680,640"
          fill="none" stroke="url(#ptG3)" strokeWidth="20" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[7] = el; }}
          d="M 1680,800 C 1440,720 1300,550 1100,580 C 880,620 940,740 720,700 C 520,660 460,820 240,780 C 120,750 20,860 -80,880"
          fill="none" stroke="url(#ptG4)" strokeWidth="14" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[8] = el; }}
          d="M 320,-60 C 380,160 280,300 480,260 C 680,220 580,420 800,380 C 980,350 900,500 1100,460 C 1280,420 1300,580 1480,540"
          fill="none" stroke="url(#ptG1)" strokeWidth="26" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[9] = el; }}
          d="M 1100,960 C 1060,780 1180,640 980,680 C 780,720 880,520 660,560 C 440,600 540,400 320,440 C 180,470 120,300 -60,260"
          fill="none" stroke="url(#ptG2)" strokeWidth="18" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[10] = el; }}
          d="M 720,-60 C 780,100 680,240 860,280 C 1020,320 920,480 1100,520 C 1260,560 1280,680 1460,710"
          fill="none" stroke="url(#ptG3)" strokeWidth="16" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[11] = el; }}
          d="M 750,960 C 690,800 780,660 600,620 C 440,580 540,420 360,380 C 200,340 240,200 80,160"
          fill="none" stroke="url(#ptG4)" strokeWidth="22" strokeLinecap="round" opacity="0" />
      </svg>

      <Outlet />
    </>
  );
}
