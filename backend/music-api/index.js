import express from "express";
import axios from "axios";
import { searchNetease, getNeteaseUrl } from "./lib/netease.js";
import { searchKugou, getKugouUrl } from "./lib/kugou.js";
import { searchQQ, getQQUrl } from "./lib/qq.js";

const PORT = process.env.MUSIC_API_PORT || 3001;
const app = express();
const METING = "https://meting.elysium-stack.cn/api";

const trackMeta = new Map();

// ── Elysium fallback search ──────────────────
async function elysiumSearch(keyword) {
  const tracks = [];
  for (const server of ["netease", "kugou"]) {
    try {
      const resp = await axios.get(METING, {
        params: { server, type: "search", id: keyword, page: 1, limit: 20 },
        timeout: 10000,
      });
      const data = resp.data;
      if (Array.isArray(data)) {
        for (const item of data) {
          if (!item.title || !item.url) continue;
          const u = new URL(item.url);
          const songId = u.searchParams.get("id") || "";
          if (!songId) continue;
          const name = server === "netease" ? "网易云" : "酷狗";
          tracks.push({
            id: `${server}:${songId}`,
            title: item.title,
            artist: item.author || "",
            cover_url: item.pic || "",
            audio_url: item.url,
            duration: null,
            source_name: name,
          });
        }
      }
    } catch {}
  }
  return tracks;
}

// ── Search ────────────────────────────────
app.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ tracks: [] });

  const directResults = await Promise.allSettled([
    searchNetease(q),
    searchKugou(q),
    searchQQ(q),
  ]);

  const tracks = [];
  const seen = new Set();
  for (const r of directResults) {
    if (r.status === "fulfilled") {
      for (const t of r.value) {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          if (t.extra) trackMeta.set(t.id, t.extra);
          tracks.push(t);
        }
      }
    }
  }

  // Fallback: if netease/kugou didn't return results, try Elysium
  const hasNetease = tracks.some((t) => t.id.startsWith("netease:"));
  const hasKugou = tracks.some((t) => t.id.startsWith("kugou:"));
  if (!hasNetease || !hasKugou) {
    const elysiumTracks = await elysiumSearch(q);
    for (const t of elysiumTracks) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        tracks.push(t);
      }
    }
  }

  res.json({ query: q, tracks });
});

// ── Play / URL resolution ─────────────────
app.get("/play", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ url: "", error: "missing id" });

  const [server, songId] = id.split(":");

  try {
    let result = null;
    const meta = trackMeta.get(id) || {};

    if (server === "netease") {
      result = await getNeteaseUrl(songId);
    } else if (server === "kugou") {
      result = await getKugouUrl(songId, meta.album_id || "");
    } else if (server === "tencent") {
      result = await getQQUrl(songId, meta.strMediaMid || "");
    }

    if (result?.url) {
      return res.json({ url: result.url, br: result.br || 0 });
    }

    // Fallback to Elysium Meting for full-song access
    if (server === "netease" || server === "kugou") {
      const songResp = await axios.get(METING, {
        params: { server, type: "song", id: songId },
        timeout: 10000,
      });
      const data = songResp.data;
      const proxyUrl = Array.isArray(data) && data[0]?.url;
      if (proxyUrl) {
        const audioResp = await axios.get(proxyUrl, {
          maxRedirects: 5,
          timeout: 10000,
        });
        const finalUrl = audioResp.request?.res?.responseUrl || proxyUrl;
        return res.json({ url: finalUrl, br: 0 });
      }
    }

    res.status(502).json({ url: "", error: "获取播放地址失败" });
  } catch (e) {
    res.status(502).json({ url: "", error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`[music-api] running on port ${PORT}`);
});
