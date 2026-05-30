const RENDER_BACKEND = "https://pancake-simr.onrender.com";

export default function MusicPage() {
  return (
    <iframe
      src={RENDER_BACKEND + "/music"}
      style={{
        width: "100%",
        height: "100dvh",
        border: "none",
        display: "block",
      }}
      title="音乐播放器"
      allow="autoplay"
    />
  );
}
