import crypto from "crypto";
import axios from "axios";

function md5(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}

export async function searchKugou(keyword, page = 1, limit = 20) {
  const url = "http://mobilecdn.kugou.com/api/v3/search/song";
  const resp = await axios.get(url, {
    params: {
      keyword,
      page,
      pagesize: limit,
      showtype: 1,
      plat: 0,
      version: 9108,
      tag: 1,
    },
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    timeout: 10000,
  });

  const list = resp.data?.data?.info || [];
  return list.map((s) => {
    const duration = s.duration || s.timelength || 0;
    return {
      id: `kugou:${s.hash || s.audio_id || ""}`,
      title: s.songname || s.filename || "",
      artist: s.singername || "",
      album: s.album_name || "",
      cover_url: s.img || "",
      audio_url: "",
      duration: Math.floor(duration / 1000),
      source_name: "酷狗",
      extra: { album_id: s.album_id || "" },
    };
  });
}

export async function getKugouUrl(songHash, albumId = "") {
  const url = `https://wwwapi.kugou.com/yy/index.php?r=play/getdata&hash=${songHash}&platid=4&album_id=${albumId}&mid=00000000000000000000000000000000`;

  const resp = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    timeout: 10000,
  });

  const data = resp.data;
  if (data.status !== 1) return null;
  if (data.data.privilege > 9) return null;

  return { url: data.data.play_backup_url || data.data.play_url, br: 0 };
}
