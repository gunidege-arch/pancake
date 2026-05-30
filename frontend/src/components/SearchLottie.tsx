import { lazy, Suspense } from "react";

const LazyLottiePlayer = lazy(() => import("./LottiePlayer"));

export default function SearchLottie() {
  return (
    <Suspense fallback={<div style={{ width: 180, height: 180, margin: "0 auto 0.5rem" }} />}>
      <LazyLottiePlayer />
    </Suspense>
  );
}
