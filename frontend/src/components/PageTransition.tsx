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

        {/* Layer 1: horizontal flowing strokes */}
        <path ref={(el) => { pathRefs.current[0] = el; }}
          d="M -80,20 C 200,-30 500,80 800,30 C 1100,-20 1350,60 1520,20"
          fill="none" stroke="url(#ptG1)" strokeWidth="84" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[1] = el; }}
          d="M 1520,85 C 1300,130 1000,40 700,90 C 400,140 200,50 -80,95"
          fill="none" stroke="url(#ptG2)" strokeWidth="88" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[2] = el; }}
          d="M -80,155 C 250,110 550,200 850,150 C 1150,100 1380,180 1520,160"
          fill="none" stroke="url(#ptG3)" strokeWidth="82" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[3] = el; }}
          d="M 1520,220 C 1280,270 950,170 650,225 C 350,280 180,190 -80,230"
          fill="none" stroke="url(#ptG4)" strokeWidth="94" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[4] = el; }}
          d="M -80,285 C 220,240 480,340 780,290 C 1080,240 1320,320 1520,280"
          fill="none" stroke="url(#ptG1)" strokeWidth="86" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[5] = el; }}
          d="M 1520,350 C 1250,400 900,300 600,355 C 300,410 150,320 -80,360"
          fill="none" stroke="url(#ptG2)" strokeWidth="82" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[6] = el; }}
          d="M -80,415 C 280,370 560,470 860,420 C 1160,370 1400,450 1520,410"
          fill="none" stroke="url(#ptG3)" strokeWidth="90" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[7] = el; }}
          d="M 1520,480 C 1220,530 880,430 580,485 C 280,540 160,450 -80,490"
          fill="none" stroke="url(#ptG4)" strokeWidth="85" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[8] = el; }}
          d="M -80,545 C 240,500 520,600 820,550 C 1120,500 1360,580 1520,540"
          fill="none" stroke="url(#ptG1)" strokeWidth="88" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[9] = el; }}
          d="M 1520,610 C 1280,660 940,560 640,615 C 340,670 180,580 -80,620"
          fill="none" stroke="url(#ptG2)" strokeWidth="84" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[10] = el; }}
          d="M -80,675 C 260,630 540,730 840,680 C 1140,630 1380,710 1520,670"
          fill="none" stroke="url(#ptG3)" strokeWidth="94" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[11] = el; }}
          d="M 1520,740 C 1240,790 900,690 600,745 C 300,800 170,710 -80,750"
          fill="none" stroke="url(#ptG4)" strokeWidth="86" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[12] = el; }}
          d="M -80,805 C 230,760 510,860 810,810 C 1110,760 1350,840 1520,800"
          fill="none" stroke="url(#ptG1)" strokeWidth="82" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[13] = el; }}
          d="M 1520,870 C 1260,920 920,820 620,875 C 320,930 160,840 -80,880"
          fill="none" stroke="url(#ptG2)" strokeWidth="90" strokeLinecap="round" opacity="0" />

        {/* Layer 2: diagonal cross strokes */}
        <path ref={(el) => { pathRefs.current[14] = el; }}
          d="M -80,-40 C 350,120 600,380 900,520 C 1200,660 1400,820 1520,940"
          fill="none" stroke="url(#ptG3)" strokeWidth="78" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[15] = el; }}
          d="M 1520,-40 C 1150,140 880,400 580,540 C 280,680 100,820 -80,940"
          fill="none" stroke="url(#ptG4)" strokeWidth="84" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[16] = el; }}
          d="M -80,90 C 380,-50 280,310 700,200 C 1080,90 980,410 1380,310 C 1500,280 1540,360 1520,400"
          fill="none" stroke="url(#ptG1)" strokeWidth="82" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[17] = el; }}
          d="M 1520,800 C 1080,940 1180,590 760,680 C 380,770 480,490 80,580 C -50,610 -70,680 -80,700"
          fill="none" stroke="url(#ptG2)" strokeWidth="88" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[18] = el; }}
          d="M -60,310 C 220,190 420,510 720,390 C 1020,270 1220,560 1500,440"
          fill="none" stroke="url(#ptG3)" strokeWidth="76" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[19] = el; }}
          d="M 1500,180 C 1180,310 860,160 560,290 C 260,420 80,230 -60,340"
          fill="none" stroke="url(#ptG4)" strokeWidth="82" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[20] = el; }}
          d="M 100,960 C 60,740 180,580 80,420 C -20,260 160,130 60,-60"
          fill="none" stroke="url(#ptG1)" strokeWidth="78" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[21] = el; }}
          d="M 1340,-60 C 1380,190 1260,360 1360,520 C 1460,680 1280,820 1380,960"
          fill="none" stroke="url(#ptG2)" strokeWidth="84" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[22] = el; }}
          d="M -80,560 C 270,480 520,720 820,610 C 1120,500 1320,700 1520,630"
          fill="none" stroke="url(#ptG3)" strokeWidth="80" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[23] = el; }}
          d="M 1520,290 C 1230,380 980,180 680,310 C 380,440 180,230 -60,330"
          fill="none" stroke="url(#ptG4)" strokeWidth="86" strokeLinecap="round" opacity="0" />
      </svg>

      <Outlet />
    </>
  );
}
