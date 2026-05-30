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
      extra: { strMediaMid: s.strMediaMid || s.songmid || "" },
    };
  });
}

export async function getQQUrl(songMid, strMediaMid = "") {
  const guid = "10000";
  const uin = "0";
  const file = strMediaMid ? `M500${strMediaMid}.mp3` : `M500${songMid}${songMid}.mp3`;

  const reqData = {
    req_0: {
      module: "vkey.GetVkeyServer",
      method: "CgiGetVkey",
      param: {
        filename: [file],
        guid,
        songmid: [songMid],
        songtype: [0],
        uin,
        loginflag: 1,
        platform: "20",
      },
    },
    loginUin: uin,
    comm: {
      uin,
      format: "json",
      ct: 24,
      cv: 0,
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

  const midurlinfo = resp.data?.req_0?.data?.midurlinfo?.[0];
  const purl = midurlinfo?.purl;
  if (!purl) return null;

  const sip = resp.data?.req_0?.data?.sip || [];
  const baseUrl = sip[0] || "https://isure6.stream.qqmusic.qq.com/";
  return { url: baseUrl + purl, br: 0 };
}
