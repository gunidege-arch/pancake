import crypto from "crypto";
import axios from "axios";

const EAPI_KEY = "e82ckenh8dichen8";

function md5(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}

function aesEncrypt(text) {
  const key = Buffer.from(EAPI_KEY);
  const data = Buffer.from(text);
  const pad = 16 - (data.length % 16);
  const padded = Buffer.concat([data, Buffer.alloc(pad, pad)]);
  const cipher = crypto.createCipheriv("aes-128-ecb", key, null);
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(padded), cipher.final()])
    .toString("hex")
    .toUpperCase();
}

function eapi(url, object) {
  const text = typeof object === "object" ? JSON.stringify(object) : object;
  const message = `nobody${url}use${text}md5forencrypt`;
  const digest = md5(message);
  const data = `${url}-36cd479b6b5-${text}-36cd479b6b5-${digest}`;
  return { params: aesEncrypt(data) };
}

const QUALITY_BR = {
  "128k": 128000,
  "320k": 320000,
  flac: 999000,
};

export async function searchNetease(keyword, limit = 20) {
  const url = "https://interface.music.163.com/api/search/pc";
  const resp = await axios.post(url, new URLSearchParams({
    s: keyword, type: 1, offset: 0, limit, total: "true",
  }).toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Content-Type": "application/x-www-form-urlencoded",
      "Referer": "https://music.163.com/",
      "Cookie": "os=pc; appver=2.10.6; NMTID=00O9v6kGqFvXJxJJXJmIJmIJnFnFnF;",
    },
    timeout: 10000,
  });
  const songs = resp.data?.result?.songs || [];
  return songs.map((s) => ({
    id: `netease:${s.id}`,
    title: s.name,
    artist: (s.artists || []).map((a) => a.name).join("、"),
    album: s.album?.name,
    cover_url: s.album?.picUrl || "",
    audio_url: "",
    duration: Math.floor((s.duration || 0) / 1000),
    source_name: "网易云",
  }));
}

let cookie = "os=pc";
const MUSIC_U = process.env.NETEASE_MUSIC_U || "";
if (MUSIC_U) cookie = `MUSIC_U=${MUSIC_U}; ` + cookie;

export async function getNeteaseUrl(songId, quality = "128k") {
  const br = QUALITY_BR[quality] || 128000;
  const targetUrl = "https://interface3.music.163.com/eapi/song/enhance/player/url";
  const eapiUrl = "/api/song/enhance/player/url";

  const d = { ids: `[${songId}]`, br };
  const data = eapi(eapiUrl, d);

  const resp = await axios.post(targetUrl, new URLSearchParams(data).toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookie,
    },
    timeout: 10000,
  });

  const song = resp.data?.data?.[0];
  if (song?.url && !song.freeTrialInfo) {
    return { url: song.url, br: song.br || 0 };
  }
  return null;
}
