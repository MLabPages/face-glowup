// 垢抜けレシピ — 端末内解析のみ。写真は外部送信しない。
// 顔ランドマーク検出に MediaPipe Tasks Vision を使用(モデルはCDNから読み込み)。
import {
  FaceLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/vision_bundle.mjs";

const els = {
  stage: document.getElementById("stage"),
  preview: document.getElementById("preview"),
  video: document.getElementById("video"),
  canvas: document.getElementById("canvas"),
  overlay: document.getElementById("overlay"),
  placeholder: document.getElementById("placeholder"),
  startCam: document.getElementById("startCam"),
  shoot: document.getElementById("shoot"),
  stopCam: document.getElementById("stopCam"),
  file: document.getElementById("file"),
  retry: document.getElementById("retry"),
  savePhoto: document.getElementById("savePhoto"),
  sharePhoto: document.getElementById("sharePhoto"),
  toggleMarks: document.getElementById("toggleMarks"),
  status: document.getElementById("status"),
  result: document.getElementById("result"),
  impression: document.getElementById("impression"),
  tips: document.getElementById("tips"),
};

let landmarker = null;
let stream = null;

// ---- ヒントの番号印(overlay)関連の状態 ----
// list: [{ num, points: [{x,y}, ...] }] 写真上に描く印のデータ(番号ありのヒントのみ)
// faceW: バッジの大きさを決めるための顔の幅(px)
let markData = { list: [], faceW: 0, faceBox: null };
let highlightNum = null; // クリックで強調中のヒント番号(nullなら強調なし)
let marksVisible = true; // 印の表示/非表示トグルの状態

function setPreviewAspect(w, h) {
  if (!w || !h) {
    els.preview.style.removeProperty("--preview-ratio");
    els.preview.style.removeProperty("--preview-ratio-number");
    return;
  }
  els.preview.style.setProperty("--preview-ratio", `${w} / ${h}`);
  els.preview.style.setProperty("--preview-ratio-number", String(w / h));
}

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
    setPreviewAspect(null, null);
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
  setPreviewAspect(els.canvas.width, els.canvas.height);
  els.placeholder.hidden = true;
  els.canvas.hidden = false;
  els.overlay.hidden = true;
  els.startCam.hidden = true;
  els.shoot.hidden = true;
  els.stopCam.hidden = true;
  els.retry.hidden = false;
}

function resetToStart() {
  setPreviewAspect(null, null);
  els.canvas.hidden = true;
  els.overlay.hidden = true;
  els.retry.hidden = true;
  els.savePhoto.hidden = true;
  els.sharePhoto.hidden = true;
  els.result.hidden = true;
  els.placeholder.hidden = false;
  els.startCam.hidden = false;
  clearOverlay();
  markData = { list: [], faceW: 0, faceBox: null };
  highlightNum = null;
  setStatus("準備完了。カメラを起動するか、写真を選んでください。");
}

// ---- 解析本体 ----
function runAnalysis(source, w, h) {
  if (!landmarker) {
    setStatus("モデルがまだ準備中です。少し待って再度お試しください。");
    return;
  }
  setStatus("解析中…");
  // 再解析時は前回の印・強調状態をいったんクリアしておく
  clearOverlay();
  highlightNum = null;
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
  renderResult(metrics, lm, w, h);
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

function makeRecipe(category, title, body, steps, accent = "") {
  return { category, title, body, steps, accent };
}

// ---- 結果表示 ----
function renderResult(m, lm, w, h) {
  const impressions = [];
  const recipes = [];

  if (m.ratio >= 1.45) {
    impressions.push(["雰囲気", "大人っぽくすっきり", "縦ラインがきれいに出やすいタイプです。"]);
    recipes.push(
      makeRecipe(
        "ヘア",
        "前髪に少し横のニュアンスを足す",
        "縦のきれいさは残しつつ、顔まわりにやわらかさが出ます。",
        ["前髪はまっすぐ下ろしすぎず、毛先だけ横に流す", "顔まわりの髪を頬骨あたりで軽く外へ逃がす", "分け目はきっちり作らず、根元を少しふんわりさせる"],
        "抜け感"
      )
    );
  } else if (m.ratio <= 1.28) {
    impressions.push(["雰囲気", "やわらかく親しみやすい", "ふんわりした印象が出やすいタイプです。"]);
    recipes.push(
      makeRecipe(
        "ヘア",
        "トップと前髪に少し高さを出す",
        "かわいらしさを活かしながら、すっきり見えるバランスに寄せられます。",
        ["前髪の根元を軽く立ち上げる", "トップはぺたんとさせず、ドライヤーで空気を入れる", "チークは丸く広げず、頬の高い位置から斜めにぼかす"],
        "小顔感"
      )
    );
  } else {
    impressions.push(["雰囲気", "バランスが取りやすい", "髪型やメイクの幅を楽しみやすいタイプです。"]);
    recipes.push(
      makeRecipe(
        "ヘア",
        "顔まわりにひと束だけ動きを作る",
        "大きく変えなくても、写真で見たときのこなれ感が出ます。",
        ["耳前の毛を細く残す", "毛先は内巻きより少し外へ流す", "オイルは毛先だけに少量つける"],
        "こなれ感"
      )
    );
  }

  if (m.eyeSpacing >= 1.15) {
    recipes.push(
      makeRecipe(
        "アイメイク",
        "目頭にほんの少しだけ明るさと締め色を足す",
        "やさしい雰囲気はそのまま、視線の中心がすっと整います。",
        ["目頭に細くハイライトを入れる", "上まぶた中央より内側に淡い締め色を重ねる", "アイラインは黒よりブラウンで細く入れる"],
        "上品"
      )
    );
  } else if (m.eyeSpacing <= 0.9) {
    recipes.push(
      makeRecipe(
        "アイメイク",
        "目尻側に余韻を作る",
        "華やかさを活かしながら、抜け感のある目元に見せられます。",
        ["アイラインは目尻だけ2mmほど伸ばす", "下まぶたの目尻側に淡い影色を置く", "まつ毛は中央より目尻を少し長めに整える"],
        "抜け感"
      )
    );
  } else {
    recipes.push(
      makeRecipe(
        "アイメイク",
        "まぶた中央に光を集める",
        "自然なバランスを活かして、写真で目元がきれいに見えます。",
        ["黒目の上に細かいパールを少量置く", "締め色は目尻から薄くぼかす", "涙袋は影を濃くしすぎず、明るさだけ足す"],
        "透明感"
      )
    );
  }

  if (m.browGapRatio >= 0.075) {
    recipes.push(
      makeRecipe(
        "眉",
        "眉下に少しだけ厚みを足す",
        "目元がぼやけず、メイク感を強くしなくても洗練されて見えます。",
        ["眉下ラインを1mmだけ描き足す", "眉頭はぼかして、眉尻は細く整える", "眉マスカラは髪色より少し明るめを選ぶ"],
        "洗練"
      )
    );
  } else if (m.browGapRatio <= 0.045) {
    recipes.push(
      makeRecipe(
        "眉",
        "眉の上側をふわっと軽くする",
        "目元の強さを活かしながら、今っぽい柔らかさが出ます。",
        ["眉頭は立ち上げすぎず自然にとかす", "眉山を濃く描かず、パウダーで薄くつなぐ", "眉下のハイライトは控えめにする"],
        "やわらか"
      )
    );
  } else {
    recipes.push(
      makeRecipe(
        "眉",
        "眉尻だけ丁寧に整える",
        "顔全体の清潔感が上がり、普段メイクでも完成度が出ます。",
        ["眉尻は小鼻と目尻の延長線を目安にする", "足りない部分だけ細く描く", "最後にスクリューブラシで境目をぼかす"],
        "清潔感"
      )
    );
  }

  if (m.brightness != null) {
    if (m.brightness < 0.35) {
      impressions.push(["写真映え", "光を足すとさらにきれい", "正面からのやわらかい光で肌の印象が上がります。"]);
      recipes.push(
        makeRecipe(
          "撮影",
          "窓の正面で肌の透明感を拾う",
          "加工より先に光を整えると、ベースメイクも髪もきれいに見えます。",
          ["窓から1mほど離れて正面を向く", "天井の強い影が出る場所は避ける", "白い壁や白い服をレフ板代わりにする"],
          "透明感"
        )
      );
    } else if (m.brightness > 0.85) {
      impressions.push(["写真映え", "少し光をやわらげると上品", "立体感が残る光にするとメイクが映えます。"]);
      recipes.push(
        makeRecipe(
          "撮影",
          "直射を避けてふんわり明るく撮る",
          "白飛びを抑えると、肌とリップの質感がきれいに残ります。",
          ["窓から少し横にずれる", "画面をタップして明るさを少し下げる", "ツヤ系ハイライトは頬の高い位置だけにする"],
          "上品ツヤ"
        )
      );
    } else {
      impressions.push(["写真映え", "明るさはきれい", "今の光でも雰囲気が伝わりやすい状態です。"]);
    }
  }

  if (m.mouthRatio < 0.36) {
    recipes.push(
      makeRecipe(
        "表情",
        "口角をほんの少しだけ上げる",
        "表情を作り込みすぎず、親しみやすい明るさが出ます。",
        ["息を軽く吐いてから撮る", "上の歯を見せすぎず、口角だけ上げる", "リップは中央にツヤを足す"],
        "好印象"
      )
    );
  }

  recipes.push(
    makeRecipe(
      "仕上げ",
      "眉・髪・肌のツヤを一か所ずつ整える",
      "大きく変えるより、細部を少し整える方が自然に垢抜けて見えます。",
      ["眉尻の余分な毛だけ整える", "前髪の生え際をコームで軽くとかす", "頬か唇のどちらか一方にツヤを足す"],
      "清潔感"
    )
  );

  markData = { list: [], faceW: 0, faceBox: null };
  els.overlay.width = w;
  els.overlay.height = h;
  clearOverlay();

  els.impression.innerHTML = impressions
    .map(
      ([k, v, n]) =>
        `<div class="card profile-card"><div class="k">${k}</div><div class="v">${v}</div><div class="n">${n}</div></div>`
    )
    .join("");
  els.tips.innerHTML = recipes
    .slice(0, 5)
    .map(
      (recipe, index) => `
        <li class="recipe-card">
          <div class="recipe-top">
            <span class="recipe-number">${index + 1}</span>
            <span class="recipe-category">${recipe.category}</span>
            <span class="recipe-accent">${recipe.accent}</span>
          </div>
          <div class="recipe-title">${recipe.title}</div>
          <p class="recipe-body">${recipe.body}</p>
          <ul class="recipe-steps">
            ${recipe.steps.map((step) => `<li>${step}</li>`).join("")}
          </ul>
        </li>`
    )
    .join("");
  els.result.hidden = false;
  els.savePhoto.hidden = false;
  // 共有ボタンは共有が使える環境のみ表示(PCブラウザ等では非対応のため自動で隠す)
  els.sharePhoto.hidden = !(
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({ files: [new File([""], "t.png", { type: "image/png" })] })
  );
  els.stage.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---- 写真上の番号印(overlay)----
function clearOverlay() {
  if (!els.overlay.width || !els.overlay.height) return;
  const ctx = els.overlay.getContext("2d");
  ctx.clearRect(0, 0, els.overlay.width, els.overlay.height);
}

// overlay に印を描く。highlightNum を指定すると、その番号だけ通常表示+拡大、他は薄く表示する
function drawMarkers(highlightNumArg) {
  clearOverlay();
  if (!marksVisible || markData.list.length === 0) return;
  drawMarkersTo(els.overlay.getContext("2d"), highlightNumArg);
}

// 角丸の矩形パスを作る(ラベルのピル描画用)
function roundRectPath(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

function averagePoint(points) {
  const total = points.reduce(
    (acc, pt) => ({ x: acc.x + pt.x, y: acc.y + pt.y }),
    { x: 0, y: 0 }
  );
  return { x: total.x / points.length, y: total.y / points.length };
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function makeFaceBox(lm, w, h, faceW, faceH) {
  const P = (i) => ({ x: lm[i].x * w, y: lm[i].y * h });
  const top = P(10);
  const chin = P(152);
  const left = P(234);
  const right = P(454);
  const padX = faceW * 0.08;
  const padY = faceH * 0.06;
  const x1 = Math.min(left.x, right.x) - padX;
  const x2 = Math.max(left.x, right.x) + padX;
  const y1 = top.y - padY;
  const y2 = chin.y + padY;
  return {
    x: clamp(x1, 0, w),
    y: clamp(y1, 0, h),
    w: clamp(x2, 0, w) - clamp(x1, 0, w),
    h: clamp(y2, 0, h) - clamp(y1, 0, h),
  };
}

function nudgeCallout(rect, axis, faceBox, placedLabels, canvasW, canvasH, edge) {
  const step = axis === "y" ? rect.h + 5 : rect.w + 5;
  const offsets = [0, -step, step, -step * 2, step * 2, -step * 3, step * 3];
  for (const offset of offsets) {
    const next = { ...rect };
    if (axis === "y") {
      next.y = clamp(rect.y + offset, edge, canvasH - rect.h - edge);
    } else {
      next.x = clamp(rect.x + offset, edge, canvasW - rect.w - edge);
    }
    if (rectsOverlap(next, faceBox)) continue;
    if (placedLabels.some((p) => rectsOverlap(next, p))) continue;
    return next;
  }
  return null;
}

function placeCallout(target, pillW, pillH, faceBox, placedLabels, canvasW, canvasH, gap, edge) {
  const faceCenterX = faceBox.x + faceBox.w / 2;
  const faceCenterY = faceBox.y + faceBox.h / 2;
  const preferRight = target.x >= faceCenterX;
  const preferBottom = target.y >= faceCenterY;
  const candidates = [
    {
      side: "right",
      axis: "y",
      x: faceBox.x + faceBox.w + gap,
      y: target.y - pillH / 2,
      preferred: preferRight,
    },
    {
      side: "left",
      axis: "y",
      x: faceBox.x - gap - pillW,
      y: target.y - pillH / 2,
      preferred: !preferRight,
    },
    {
      side: "bottom",
      axis: "x",
      x: target.x - pillW / 2,
      y: faceBox.y + faceBox.h + gap,
      preferred: preferBottom,
    },
    {
      side: "top",
      axis: "x",
      x: target.x - pillW / 2,
      y: faceBox.y - gap - pillH,
      preferred: !preferBottom,
    },
  ];

  const valid = candidates
    .map((candidate) => {
      const rect = {
        side: candidate.side,
        axis: candidate.axis,
        x: clamp(candidate.x, edge, canvasW - pillW - edge),
        y: clamp(candidate.y, edge, canvasH - pillH - edge),
        w: pillW,
        h: pillH,
      };
      if (rectsOverlap(rect, faceBox)) return null;
      const nudged = nudgeCallout(rect, candidate.axis, faceBox, placedLabels, canvasW, canvasH, edge);
      if (!nudged) return null;
      const dx = nudged.x + pillW / 2 - target.x;
      const dy = nudged.y + pillH / 2 - target.y;
      const overlapPenalty = placedLabels.some((p) => rectsOverlap(nudged, p)) ? 10000 : 0;
      return {
        ...nudged,
        side: candidate.side,
        score: Math.hypot(dx, dy) + overlapPenalty + (candidate.preferred ? 0 : 80),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score);

  if (valid.length > 0) return valid[0];

  // 顔まわりの余白が極端に少ない写真では、文字を顔に重ねないことを優先して非表示にする。
  return null;
}

// マーカー群を指定の ctx に描く(overlay 描画と保存用の焼き込みで共用)
function drawMarkersTo(ctx, highlightNumArg) {
  if (markData.list.length === 0) return;

  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#7cc4ff";
  const baseR = Math.min(Math.max(markData.faceW * 0.05, 12), 26);
  const faceBox =
    markData.faceBox || { x: ctx.canvas.width * 0.22, y: ctx.canvas.height * 0.12, w: ctx.canvas.width * 0.56, h: ctx.canvas.height * 0.68 };
  const edge = Math.max(6, baseR * 0.45);
  const gap = Math.max(10, baseR * 0.8);
  const placedLabels = []; // 描いたラベルの矩形(重なり回避用)

  markData.list.forEach((entry) => {
    const isHighlighted = highlightNumArg != null && highlightNumArg === entry.num;
    const isDimmed = highlightNumArg != null && !isHighlighted;
    const r = isHighlighted ? baseR * 1.15 : baseR;
    const target = averagePoint(entry.points);

    ctx.save();
    ctx.globalAlpha = isDimmed ? 0.35 : 1;

    entry.points.forEach((pt) => {
      // 対象位置は小さな点だけにして、顔に文字や大きなバッジを重ねない。
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isHighlighted ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = accent;
      ctx.stroke();
    });

    // 短縮版ラベルは顔の外側の余白へ置き、細い線で対象位置へつなぐ。
    if (entry.label) {
      const canvasW = ctx.canvas.width;
      const canvasH = ctx.canvas.height;
      const fontSize = Math.max(11, r * 0.85);
      ctx.font = `bold ${Math.round(fontSize)}px system-ui, sans-serif`;
      const label = `${entry.num}. ${entry.label}`;
      const padX = fontSize * 0.6;
      const pillW = ctx.measureText(label).width + padX * 2;
      const pillH = fontSize * 1.7;
      const rect = placeCallout(target, pillW, pillH, faceBox, placedLabels, canvasW, canvasH, gap, edge);
      if (!rect) {
        ctx.restore();
        return;
      }
      placedLabels.push(rect);

      const labelAnchor = {
        x: clamp(target.x, rect.x + 8, rect.x + rect.w - 8),
        y: clamp(target.y, rect.y + 8, rect.y + rect.h - 8),
      };
      if (rect.side === "left") labelAnchor.x = rect.x + rect.w;
      if (rect.side === "right") labelAnchor.x = rect.x;
      if (rect.side === "top") labelAnchor.y = rect.y + rect.h;
      if (rect.side === "bottom") labelAnchor.y = rect.y;

      // 対象位置から顔外のコメントへ伸びる線。
      ctx.beginPath();
      ctx.moveTo(target.x, target.y);
      ctx.lineTo(labelAnchor.x, labelAnchor.y);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.78)";
      ctx.lineWidth = isHighlighted ? 2.5 : 1.7;
      ctx.stroke();

      // ピル(角丸背景)+ 白の太字テキスト
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 6;
      roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, rect.h / 2);
      ctx.fillStyle = "rgba(13, 16, 23, 0.84)";
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = accent;
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
    }

    ctx.restore();
  });
}

// 写真を一時 canvas に合成して返す(保存・共有で共用)。
function composeAnnotatedCanvas() {
  const w = els.canvas.width;
  const h = els.canvas.height;
  if (!w || !h) return null;
  const temp = document.createElement("canvas");
  temp.width = w;
  temp.height = h;
  const tempCtx = temp.getContext("2d");
  tempCtx.drawImage(els.canvas, 0, 0, w, h);
  return temp;
}

// ファイル名: akanuke-recipe_YYYYMMDD-HHMMSS.png(現在時刻)
function annotatedFileName() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `akanuke-recipe_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.png`
  );
}

// 写真を PNG としてダウンロード保存する。
// ダウンロードは本人の端末内への保存なので「写真は端末外に送らない」方針と両立する。
function saveAnnotatedPhoto() {
  const temp = composeAnnotatedCanvas();
  if (!temp) return;

  temp.toBlob((blob) => {
    if (!blob) {
      setStatus("写真の保存に失敗しました。もう一度お試しください。");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = annotatedFileName();
    a.click();
    URL.revokeObjectURL(url);
    setStatus("写真を保存しました(端末の中だけに保存されます)。");
  }, "image/png");
}

// 写真を Web Share API で共有する(共有先は本人が選ぶ)。
function shareAnnotatedPhoto() {
  const temp = composeAnnotatedCanvas();
  if (!temp) return;

  // toBlob の await を挟むと iOS Safari でユーザー操作の有効期限が切れて share が
  // 失敗することがあるため、同期処理で File を作ってから navigator.share を呼ぶ
  const dataUrl = temp.toDataURL("image/png");
  const bin = atob(dataUrl.split(",")[1]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const file = new File([bytes], annotatedFileName(), { type: "image/png" });

  navigator.share({ files: [file], title: "垢抜けレシピ" }).catch((e) => {
    // ユーザーが共有メニューを閉じただけ(AbortError)の場合は何もしない
    if (e && e.name === "AbortError") return;
    setStatus("共有できませんでした。「写真を保存」をお使いください。");
  });
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
els.savePhoto.addEventListener("click", saveAnnotatedPhoto);
els.sharePhoto.addEventListener("click", shareAnnotatedPhoto);
els.file.addEventListener("change", (e) => {
  const f = e.target.files && e.target.files[0];
  if (f) analyzeFromFile(f);
  e.target.value = ""; // 同じファイルを再選択できるように
});

// ヒント項目クリックで、その番号の印だけ強調(もう一度クリックで解除)
els.tips.addEventListener("click", (e) => {
  const li = e.target.closest("li[data-num]");
  if (!li) return; // 「全体」向けのヒントはクリックしても何もしない
  const num = Number(li.dataset.num);
  highlightNum = highlightNum === num ? null : num;
  els.tips.querySelectorAll("li[data-num]").forEach((item) => {
    item.classList.toggle("selected", Number(item.dataset.num) === highlightNum);
  });
  drawMarkers(highlightNum);
});

initModel();

// 動作確認用フック: URLに ?debug が付いている場合のみ、外部から解析を呼び出せるようにする
if (new URLSearchParams(location.search).has("debug")) {
  window.__faceGlowup = { analyzeFromFile };
}
