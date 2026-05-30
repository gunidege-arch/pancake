import Lottie from "lottie-react";
import searchAnimation from "../assets/search-lottie.json";

export default function LottiePlayer() {
  return (
    <Lottie
      animationData={searchAnimation}
      loop
      style={{ width: 180, height: 180, margin: "0 auto 0.5rem" }}
    />
  );
}
