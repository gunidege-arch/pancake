import crypto from "crypto";
import axios from "axios";

const EAPI_KEY = "e82ckenh8dichen8";

function aesEncrypt(text, key) {
  const pad = 16 - (text.length % 16);
  const padded = Buffer.concat([text, Buffer.alloc(pad, pad)]);
  const cipher = crypto.createCipheriv("aes-128-ecb", key, null);
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(padded), cipher.final()])
    .toString("hex")
    .toUpperCase();
}

function md5(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}

export function eapiEncrypt(url, data) {
  const text = JSON.stringify(data);
  const digest = md5(`nobody${url}use${text}md5forencrypt`);
  const body = `${url}-36cd479b6b5-${text}-36cd479b6b5-${digest}`;
  return { params: aesEncrypt(Buffer.from(body), Buffer.from(EAPI_KEY)) };
}

const QUALITY_MAP = {
  "128k": "standard",
  "320k": "exhigh",
  flac: "lossless",
  hires: "hires",
};

export async function searchNetease(keyword, limit = 20) {
  const url = "https://interface.music.163.com/api/search/pc";
  const resp = await axios.post(url, new URLSearchParams({
    s: keyword, type: 1, offset: 0, limit, total: "true",
  }).toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Content-Type": "application/x-www-form-urlencoded",
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

export async function getNeteaseUrl(songId, quality = "standard") {
  const path = "/api/song/enhance/player/url/v1";
  const url = "https://interface.music.163.com/eapi/song/enhance/player/url/v1";
  const level = QUALITY_MAP[quality] || "standard";
  const MUSIC_U = process.env.NETEASE_MUSIC_U || "";

  const resp = await axios.post(url, eapiEncrypt(path, {
    ids: JSON.stringify([songId]),
    level,
    encodeType: "mp3",
  }), {
    headers: {
      "User-Agent": "NeteaseMusic/9.3.0.250516233250(9003000);Dalvik/2.1.0 (Linux; U; Android 12; ABR-AL80 Build/9b35a01.0)",
      Cookie: `MUSIC_U=${MUSIC_U};`,
    },
    timeout: 10000,
  });

  const data = resp.data?.data?.[0];
  if (data?.url) {
    return { url: data.url.split("?")[0], br: data.br || 0 };
  }
  return null;
}
