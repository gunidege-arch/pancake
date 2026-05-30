import { useState, useCallback, useRef, useEffect } from "react";

const API_BASE = "/api";

export interface MusicSource {
  id: number;
  name: string;
  api_url_template: string;
  is_builtin: boolean;
}

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

function getDeviceId(): string {
  const key = "pancake-device-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export function useMusic() {
  const [sources, setSources] = useState<MusicSource[]>([]);
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

  /* ── Sources ──────────────────────────── */

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/music/sources?device_id=${encodeURIComponent(getDeviceId())}`);
      if (res.ok) setSources(await res.json());
    } catch { /* offline */ }
  }, []);

  const addSource = useCallback(async (name: string, apiUrl: string) => {
    try {
      const res = await fetch(`${API_BASE}/music/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, api_url_template: apiUrl, device_id: getDeviceId() }),
      });
      if (res.ok) {
        const created = await res.json();
        setSources((prev) => [...prev, created]);
      }
    } catch { /* */ }
  }, []);

  const deleteSource = useCallback(async (id: number) => {
    try {
      await fetch(`${API_BASE}/music/sources/${id}?device_id=${encodeURIComponent(getDeviceId())}`, { method: "DELETE" });
      setSources((prev) => prev.filter((s) => s.id !== id));
    } catch { /* */ }
  }, []);

  /* ── Search ───────────────────────────── */

  const search = useCallback(async (q: string) => {
    setQuery(q);
    if (!q.trim()) { setTracks([]); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/music/search?q=${encodeURIComponent(q)}&device_id=${encodeURIComponent(getDeviceId())}`);
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

  const play = useCallback((track: MusicTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTrack(track);
    audio.src = track.audio_url;
    audio.load();
    audio.play().catch(() => { /* autoplay blocked */ });
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
    sources, fetchSources, addSource, deleteSource,
    query, tracks, loading, error, search,
    currentTrack, isPlaying, currentTime, duration, volume,
    play, togglePlay, seek, setVolume: setVolumePersist, playNext, playPrev,
  };
}
