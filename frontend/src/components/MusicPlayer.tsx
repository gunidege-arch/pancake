import type { MusicTrack } from "../hooks/useMusic";

function fmtTime(s: number) {
  if (!s || !isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

interface Props {
  track: MusicTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onToggle: () => void;
  onSeek: (t: number) => void;
  onVolume: (v: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function MusicPlayer({ track, isPlaying, currentTime, duration, volume, onToggle, onSeek, onVolume, onPrev, onNext }: Props) {
  if (!track) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="music-player">
      <div className="music-player-progress">
        <div className="music-player-progress-bar" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          onSeek(pct * duration);
        }}>
          <div className="music-player-progress-fill" style={{ width: `${progress}%` }} />
          <div className="music-player-progress-thumb" style={{ left: `${progress}%` }} />
        </div>
      </div>

      <div className="music-player-main">
        <div className="music-player-info">
          {track.cover_url && (
            <img className={`music-player-cover ${isPlaying ? "spinning" : ""}`} src={track.cover_url} alt="" />
          )}
          <div className="music-player-meta">
            <div className="music-player-title">{track.title}</div>
            <div className="music-player-artist">{track.artist || track.source_name}</div>
          </div>
        </div>

        <div className="music-player-controls">
          <button className="mp-btn" onClick={onPrev} aria-label="上一首">
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          <button className="mp-btn mp-btn-play" onClick={onToggle} aria-label={isPlaying ? "暂停" : "播放"}>
            {isPlaying ? (
              <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <button className="mp-btn" onClick={onNext} aria-label="下一首">
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>

        <div className="music-player-volume">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" opacity={0.5}>
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
          </svg>
          <input
            type="range" min="0" max="1" step="0.02" value={volume}
            onChange={(e) => onVolume(parseFloat(e.target.value))}
            className="music-player-volume-slider"
          />
        </div>

        <div className="music-player-time">
          <span>{fmtTime(currentTime)} / {fmtTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
