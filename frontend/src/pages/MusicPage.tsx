const RENDER = "https://pancake-simr.onrender.com";

export default function MusicPage() {
  return (
    <iframe
      src={RENDER + "/music"}
      style={{
        width: "100%",
        height: "100dvh",
        border: "none",
        display: "block",
      }}
      title="LX Music"
      allow="autoplay; clipboard-write"
    />
  );
}
