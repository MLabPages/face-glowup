// 垢抜けチェック — 端末内解析のみ。写真は外部送信しない。
// 顔ランドマーク検出に MediaPipe Tasks Vision を使用(モデルはCDNから読み込み)。
import {
  FaceLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/vision_bundle.mjs";

const els = {
  video: document.getElementById("video"),
  canvas: document.getElementById("canvas"),
  placeholder: document.getElementById("placeholder"),
  startCam: document.getElementById("startCam"),
  shoot: document.getElementById("shoot"),
  stopCam: document.getElementById("stopCam"),
  file: document.getElementById("file"),
  retry: document.getElementById("retry"),
  status: document.getElementById("status"),
  result: document.getElementById("result"),
  impression: document.getElementById("impression"),
  tips: document.getElementById("tips"),
};

let landmarker = null;
let stream = null;

function setStatus(msg) {
  els.status.textContent = msg || "";
}

// ---- モデル初期化 ----
async function initModel() {
  try {
    const fileset = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm"
    );
    landmarker = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "IMAGE",
      numFaces: 1,
    });
    setStatus("準備完了。カメラを起動するか、写真を選んでください。");
    els.startCam.disabled = false;
  } catch (e) {
    console.error(e);
    setStatus("モデルの読み込みに失敗しました。通信環境を確認して再読み込みしてください。");
  }
}

// ---- カメラ ----
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 960 } },
      audio: false,
    });
    els.video.srcObject = stream;
    await els.video.play();
    els.placeholder.hidden = true;
    els.video.hidden = false;
    els.canvas.hidden = true;
    els.startCam.hidden = true;
    els.shoot.hidden = false;
    els.stopCam.hidden = false;
    els.retry.hidden = true;
    els.result.hidden = true;
    setStatus("顔が画面に収まったら「この顔で解析」を押してください。");
  } catch (e) {
    console.error(e);
    setStatus("カメラを起動できませんでした。権限を確認するか、写真アップロードをお使いください。");
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  els.video.hidden = true;
  els.shoot.hidden = true;
  els.stopCam.hidden = true;
  els.startCam.hidden = false;
  if (els.canvas.hidden && els.result.hidden) {
    els.placeholder.hidden = false;
  }
}

// カメラの現在フレームを canvas に描いて解析
function analyzeFromVideo() {
  const w = els.video.videoWidth;
  const h = els.video.videoHeight;
  if (!w || !h) return;
  const ctx = els.canvas.getContext("2d");
  els.canvas.width = w;
  els.canvas.height = h;
  ctx.drawImage(els.video, 0, 0, w, h);
  showCanvas();
  runAnalysis(els.canvas, w, h);
}

// 画像ファイルを解析
function analyzeFromFile(fileObj) {
  const img = new Image();
  img.onload = () => {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const ctx = els.canvas.getContext("2d");
    els.canvas.width = w;
    els.canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);
    showCanvas();
    runAnalysis(els.canvas, w, h);
    URL.revokeObjectURL(img.src);
  };
  img.onerror = () => setStatus("画像を読み込めませんでした。別の写真をお試しください。");
  img.src = URL.createObjectURL(fileObj);
}

function showCanvas() {
  stopCamera();
  els.placeholder.hidden = true;
  els.canvas.hidden = false;
  els.startCam.hidden = true;
  els.shoot.hidden = true;
  els.stopCam.hidden = true;
  els.retry.hidden = false;
}

function resetToStart() {
  els.canvas.hidden = true;
  els.retry.hidden = true;
  els.result.hidden = true;
  els.placeholder.hidden = false;
  els.startCam.hidden = false;
  setStatus("準備完了。カメラを起動するか、写真を選んでください。");
}

// ---- 解析本体 ----
function runAnalysis(source, w, h) {
  if (!landmarker) {
    setStatus("モデルがまだ準備中です。少し待って再度お試しください。");
    return;
  }
  setStatus("解析中…");
  let res;
  try {
    res = landmarker.detect(source);
  } catch (e) {
    console.error(e);
    setStatus("解析に失敗しました。もう一度お試しください。");
    return;
  }
  if (!res.faceLandmarks || res.faceLandmarks.length === 0) {
    setStatus("顔を検出できませんでした。明るい場所で、顔が大きく写るようにしてください。");
    return;
  }
  const lm = res.faceLandmarks[0];
  const metrics = computeMetrics(lm, w, h);
  const brightness = sampleBrightness(source, lm, w, h);
  metrics.brightness = brightness;
  renderResult(metrics);
  setStatus("解析が完了しました。");
}

// 正規化ランドマーク(0-1)をピクセル座標に変換して各指標を計算
function computeMetrics(lm, w, h) {
  const P = (i) => ({ x: lm[i].x * w, y: lm[i].y * h });
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  const top = P(10); // 額の上
  const chin = P(152); // あご先
  const left = P(234); // 左頬(向かって右)
  const right = P(454); // 右頬
  const faceH = d(top, chin);
  const faceW = d(left, right);
  const ratio = faceH / faceW; // 顔の縦横比(高いほど面長)

  // 目
  const eyeLouter = P(33), eyeLinner = P(133);
  const eyeRinner = P(362), eyeRouter = P(263);
  const eyeWidth = (d(eyeLouter, eyeLinner) + d(eyeRinner, eyeRouter)) / 2;
  const interEye = d(eyeLinner, eyeRinner); // 目頭同士の距離
  const eyeSpacing = interEye / eyeWidth; // 目1つ分=1.0 が目安

  // 眉と目の縦の間隔(眉頭〜目上)
  const browL = P(105), eyeLtop = P(159);
  const browR = P(334), eyeRtop = P(386);
  const browGap = (Math.abs(browL.y - eyeLtop.y) + Math.abs(browR.y - eyeRtop.y)) / 2;
  const browGapRatio = browGap / faceH; // 顔の高さに対する眉-目の距離

  // 眉の角度(眉頭→眉尻の傾き、平均)
  const browLtail = P(107), browRtail = P(336);
  const angL = Math.atan2(browL.y - browLtail.y, Math.abs(browL.x - browLtail.x));
  const angR = Math.atan2(browR.y - browRtail.y, Math.abs(browR.x - browRtail.x));
  const browAngle = ((angL + angR) / 2) * (180 / Math.PI); // 正=眉尻上がり

  // 口の横幅(顔幅比)
  const mouthL = P(61), mouthR = P(291);
  const mouthRatio = d(mouthL, mouthR) / faceW;

  // 左右対称性:顔中心線からの左右頬の距離差
  const midX = (top.x + chin.x) / 2;
  const symDiff = Math.abs(Math.abs(left.x - midX) - Math.abs(right.x - midX)) / faceW;

  return { ratio, eyeSpacing, browGapRatio, browAngle, mouthRatio, symDiff };
}

// 頬あたりの平均明るさを取得(肌の明るさ/写真の露出の目安)
function sampleBrightness(source, lm, w, h) {
  try {
    const ctx = source.getContext ? source.getContext("2d") : null;
    if (!ctx) return null;
    const cx = Math.round(lm[50].x * w); // 左頬あたり
    const cy = Math.round(lm[50].y * h);
    const s = Math.max(6, Math.round(w * 0.04));
    const x0 = Math.max(0, cx - s), y0 = Math.max(0, cy - s);
    const data = ctx.getImageData(x0, y0, s * 2, s * 2).data;
    let sum = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      n++;
    }
    return n ? sum / n / 255 : null; // 0-1
  } catch (e) {
    return null; // 画像由来でgetImageDataが失敗する場合(CORS等)
  }
}

// ---- 結果表示 ----
function renderResult(m) {
  const impressions = [];
  const tips = [];

  // 顔の縦横比
  if (m.ratio >= 1.45) {
    impressions.push(["輪郭の傾向", "やや面長・縦のライン", "縦長は落ち着いた大人の印象になりやすいです。"]);
    tips.push("<b>前髪・分け目</b>で縦の余白を少し埋めると、バランスよく見えます。前髪を横に流す/やや厚めにするのが好相性です。");
  } else if (m.ratio <= 1.28) {
    impressions.push(["輪郭の傾向", "やや丸み・横のライン", "丸みは親しみやすく若々しい印象になりやすいです。"]);
    tips.push("<b>トップにボリューム</b>を出す髪型や、縦を意識したチークで、すっきりした印象を足せます。");
  } else {
    impressions.push(["輪郭の傾向", "バランス型", "縦横のバランスが取れた輪郭です。"]);
  }

  // 目の間隔
  if (m.eyeSpacing >= 1.15) {
    impressions.push(["目の配置", "やや離れ気味", "おっとり・優しい印象になりやすい配置です。"]);
    tips.push("<b>目頭側のアイメイク</b>(目頭切開ライン・目頭に濃さ)で中心に寄せると、キリッと見えます。");
  } else if (m.eyeSpacing <= 0.9) {
    impressions.push(["目の配置", "やや寄り気味", "意志的で華やかな印象になりやすい配置です。"]);
    tips.push("<b>目尻側を強調</b>(目尻に向けてアイラインを伸ばす)すると、横幅が出て抜け感が生まれます。");
  } else {
    impressions.push(["目の配置", "標準的", "目と目の間隔はバランスの良い配置です。"]);
  }

  // 眉と目の距離
  if (m.browGapRatio >= 0.075) {
    impressions.push(["眉と目の距離", "やや離れ気味", "離れていると柔らかい・幼い印象になりやすいです。"]);
    tips.push("<b>眉を少し下げる/太めに整える</b>と目と眉が近づき、顔が引き締まって見えます。垢抜けの効果が出やすいポイントです。");
  } else if (m.browGapRatio <= 0.045) {
    impressions.push(["眉と目の距離", "やや近い", "近いと彫りが深く大人っぽい印象になりやすいです。"]);
  } else {
    impressions.push(["眉と目の距離", "標準的", "眉と目の距離はバランスが取れています。"]);
  }

  // 眉の角度
  if (m.browAngle <= 2) {
    tips.push("<b>眉尻を少し上げて</b>アーチをつけると、顔の余白が締まって洗練された印象になります(平行眉→やや角度)。");
  } else if (m.browAngle >= 12) {
    tips.push("<b>眉山をなだらかに</b>すると、きつさが和らいで今っぽい柔らかさが出ます。");
  }

  // 左右対称性(誰でも多少ある。前向きに)
  if (m.symDiff >= 0.04) {
    tips.push("<b>撮影の角度</b>を左右で試すと、写りが安定します。少しあごを引き、正面よりわずかに角度をつけると自然です(左右差は誰にでもあるので気にしすぎなくて大丈夫)。");
  }

  // 明るさ(写真の撮り方の助言)
  if (m.brightness != null) {
    if (m.brightness < 0.35) {
      impressions.push(["写真の明るさ", "やや暗め", "光が足りないと垢抜けて見えにくくなります。"]);
      tips.push("<b>光を正面から</b>:窓の方を向く、または明るい壁の前で撮ると、肌が均一に明るく写り印象が上がります。");
    } else if (m.brightness > 0.85) {
      impressions.push(["写真の明るさ", "やや明るすぎ", "白飛びすると立体感が失われます。"]);
      tips.push("<b>光を少し弱める</b>:直射やライト正面を避けると、顔の立体感が出ます。");
    } else {
      impressions.push(["写真の明るさ", "良好", "明るさは垢抜けて見えやすい範囲です。"]);
    }
  }

  // 口幅(表情の提案)
  if (m.mouthRatio < 0.36) {
    tips.push("<b>軽い笑顔</b>(口角を少し上げる)で写ると、表情が明るく親しみやすい印象になります。");
  }

  // 共通の締めヒント
  tips.push("<b>清潔感の土台</b>:眉を整える・前髪の生え際を軽くする・肌の保湿の3つは、どんな顔立ちでも垢抜けに効きます。");

  // 描画
  els.impression.innerHTML = impressions
    .map(
      ([k, v, n]) =>
        `<div class="card"><div class="k">${k}</div><div class="v">${v}</div><div class="n">${n}</div></div>`
    )
    .join("");
  els.tips.innerHTML = tips.map((t) => `<li>${t}</li>`).join("");
  els.result.hidden = false;
  els.result.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---- イベント ----
els.startCam.disabled = true;
els.startCam.addEventListener("click", startCamera);
els.shoot.addEventListener("click", analyzeFromVideo);
els.stopCam.addEventListener("click", () => {
  stopCamera();
  resetToStart();
});
els.retry.addEventListener("click", resetToStart);
els.file.addEventListener("change", (e) => {
  const f = e.target.files && e.target.files[0];
  if (f) analyzeFromFile(f);
  e.target.value = ""; // 同じファイルを再選択できるように
});

initModel();
