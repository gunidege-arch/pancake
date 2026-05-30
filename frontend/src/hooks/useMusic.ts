import { useState, useCallback, useRef, useEffect } from "react";

const API_BASE = "/api";

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  cover_url?: string;
  audio_url: string;
  duration?: number;
  source_name: string;
}

export function useMusic() {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Playback
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const v = localStorage.getItem("pancake-volume");
    return v ? parseFloat(v) : 0.7;
  });
  const [resolvingUrl, setResolvingUrl] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.pause();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  /* ── Search ───────────────────────────── */

  const search = useCallback(async (q: string) => {
    setQuery(q);
    if (!q.trim()) { setTracks([]); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/music/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setTracks(data.tracks || []);
        if (data.tracks?.length === 0) setError("未找到结果");
      } else {
        setError("搜索失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Playback ─────────────────────────── */

  const play = useCallback(async (track: MusicTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    setCurrentTrack(track);

    if (track.audio_url) {
      audio.src = track.audio_url;
      audio.load();
      audio.play().catch(() => {});
      return;
    }

    // Resolve play URL on demand
    setResolvingUrl(true);
    try {
      const res = await fetch(`${API_BASE}/music/play?id=${encodeURIComponent(track.id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          track.audio_url = data.url;
          audio.src = data.url;
          audio.load();
          audio.play().catch(() => {});
        } else {
          setError("获取播放地址失败");
        }
      }
    } catch {
      setError("网络错误");
    } finally {
      setResolvingUrl(false);
    }
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }, [currentTrack]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) { audio.currentTime = time; setCurrentTime(time); }
  }, []);

  const setVolumePersist = useCallback((v: number) => {
    setVolume(v);
    localStorage.setItem("pancake-volume", String(v));
  }, []);

  const playNext = useCallback(() => {
    if (!currentTrack || tracks.length === 0) return;
    const idx = tracks.findIndex((t) => t.id === currentTrack.id);
    if (idx < tracks.length - 1) play(tracks[idx + 1]);
  }, [currentTrack, tracks, play]);

  const playPrev = useCallback(() => {
    if (!currentTrack || tracks.length === 0) return;
    const idx = tracks.findIndex((t) => t.id === currentTrack.id);
    if (idx > 0) play(tracks[idx - 1]);
  }, [currentTrack, tracks, play]);

  return {
    query, tracks, loading, error, search,
    currentTrack, isPlaying, currentTime, duration, volume, resolvingUrl,
    play, togglePlay, seek, setVolume: setVolumePersist, playNext, playPrev,
  };
}
