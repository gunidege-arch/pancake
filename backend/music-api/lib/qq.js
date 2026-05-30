import crypto from "crypto";
import axios from "axios";

export async function searchQQ(keyword, limit = 20) {
  const resp = await axios.get("https://c.y.qq.com/soso/fcgi-bin/client_search_cp", {
    params: { w: keyword, format: "json", n: limit },
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Referer: "https://y.qq.com",
    },
    timeout: 10000,
  });

  const songs = resp.data?.data?.song?.list || [];
  return songs.map((s) => {
    const singers = (s.singer || []).map((si) => si.name).join("、");
    return {
      id: `tencent:${s.songmid || s.songid}`,
      title: s.songname || "",
      artist: singers,
      album: s.albumname || "",
      cover_url: s.albummid
        ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${s.albummid}.jpg`
        : "",
      audio_url: "",
      duration: s.interval || 0,
      source_name: "QQ音乐",
    };
  });
}

export async function getQQUrl(songMid) {
  const guid = (Math.random() * 10000000).toFixed(0);
  const uin = process.env.QQ_UIN || "0";

  const reqData = {
    req_0: {
      module: "vkey.GetVkeyServer",
      method: "CgiGetVkey",
      param: {
        guid,
        songmid: [songMid],
        songtype: [0],
        uin,
        loginflag: 1,
        platform: "20",
      },
    },
  };

  const resp = await axios.get("https://u.y.qq.com/cgi-bin/musicu.fcg", {
    params: {
      format: "json",
      data: JSON.stringify(reqData),
    },
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Referer: "https://y.qq.com",
    },
    timeout: 10000,
  });

  const purl = resp.data?.req_0?.data?.midurlinfo?.[0]?.purl;
  if (purl) {
    return { url: `https://isure6.stream.qqmusic.qq.com/${purl}`, br: 0 };
  }

  // Try alternative CDN
  const cdnList = [
    "http://ws.stream.qqmusic.qq.com/",
    "https://isure6.stream.qqmusic.qq.com/",
  ];
  for (const cdn of cdnList) {
    if (purl) return { url: cdn + purl, br: 0 };
  }
  return null;
}
