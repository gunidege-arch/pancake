import crypto from "crypto";
import axios from "axios";

function md5(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}

function sortParams(params) {
  const sorted = {};
  Object.keys(params).sort().forEach((k) => {
    sorted[k] = params[k];
  });
  return sorted;
}

function buildSignature(params, body = "") {
  const sorted = sortParams(params);
  const kv = Object.entries(sorted)
    .map(([k, v]) => `${k}=${v}`)
    .join("");
  return md5("OIlwieks28dk2k092lksi2UIkp" + kv + body + "OIlwieks28dk2k092lksi2UIkp");
}

const KG_MID = "musicapi";
const KG_KEY = "57ae12eb6890223e355ccfcb74edf70d";

function getKey(hash, userId) {
  return md5(hash.toLowerCase() + KG_KEY + "1005" + KG_MID + userId);
}

export async function searchKugou(keyword, page = 1, limit = 20) {
  const url = "https://mobilecdn.kugou.com/api/v3/search/song";
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
    };
  });
}

export async function getKugouUrl(songHash, albumId = "") {
  const userId = process.env.KUGOU_USERID || "0";
  const token = process.env.KUGOU_TOKEN || "";

  // First get song info to get album_audio_id
  let albumAudioId = 0;
  try {
    const infoResp = await axios.post(
      "https://gateway.kugou.com/v3/album_audio/audio",
      {
        area_code: "1",
        show_privilege: "1",
        show_album_info: "1",
        is_publish: "",
        appid: 1005,
        clientver: 11451,
        mid: "114514",
        dfid: "-",
        clienttime: Math.floor(Date.now() / 1000),
        key: KG_KEY,
        data: [{ hash: songHash }],
      },
      {
        headers: {
          "KG-THash": "13a3164",
          "KG-RC": "1",
          "KG-Fake": "0",
          "KG-RF": "00869891",
          "User-Agent": "Android712-AndroidPhone-11451-376-0-FeeCacheUpdate-wifi",
          "x-router": "kmr.service.kugou.com",
        },
        timeout: 10000,
      }
    );
    const info = infoResp.data?.data?.[0]?.[0];
    albumId = albumId || info?.album_info?.album_id || "";
    albumAudioId = info?.album_audio_id || 0;
  } catch {
    // continue without album info
  }

  const params = sortParams({
    album_id: albumId,
    userid: userId,
    area_code: 1,
    hash: songHash,
    mid: KG_MID,
    appid: "1005",
    ssa_flag: "is_fromtrack",
    clientver: "20349",
    token,
    album_audio_id: albumAudioId,
    behavior: "play",
    clienttime: Math.floor(Date.now() / 1000),
    pid: "2",
    key: getKey(songHash, { userid: userId }),
    quality: "128",
    version: "20349",
    dfid: "-",
    pidversion: 3001,
  });

  const signature = buildSignature(params);
  params.signature = signature;

  const urlResp = await axios.get("http://tracker.kugou.com/v5/url", {
    params,
    headers: {
      "User-Agent": "Android12-AndroidCar-20089-46-0-NetMusic-wifi",
      "KG-THash": "255d751",
      "KG-Rec": "1",
      "KG-RC": "1",
    },
    timeout: 10000,
  });

  const playUrl = urlResp.data?.url?.[0];
  if (playUrl) {
    return { url: playUrl, br: 0 };
  }
  return null;
}
