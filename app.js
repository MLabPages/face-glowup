// 写真は端末内だけで処理し、顔の良し悪しやパーツの比率は判定しない。

const els = {
  moodOptions: [...document.querySelectorAll(".mood-option")],
  focusOptions: [...document.querySelectorAll(".focus-option")],
  noPhoto: document.getElementById("noPhoto"),
  startCam: document.getElementById("startCam"),
  pickPhoto: document.getElementById("pickPhoto"),
  file: document.getElementById("file"),
  cameraStage: document.getElementById("cameraStage"),
  preview: document.getElementById("preview"),
  video: document.getElementById("video"),
  canvas: document.getElementById("canvas"),
  placeholder: document.getElementById("placeholder"),
  shoot: document.getElementById("shoot"),
  cancelPhoto: document.getElementById("cancelPhoto"),
  status: document.getElementById("status"),
  result: document.getElementById("result"),
  resultTitle: document.getElementById("resultTitle"),
  resultBody: document.getElementById("resultBody"),
  steps: document.getElementById("steps"),
  timeMeta: document.getElementById("timeMeta"),
  toolMeta: document.getElementById("toolMeta"),
  lightTip: document.getElementById("lightTip"),
  chooseThis: document.getElementById("chooseThis"),
  another: document.getElementById("another"),
  finish: document.getElementById("finish"),
  done: document.getElementById("done"),
  restart: document.getElementById("restart"),
};

const recipes = {
  calm: {
    hair: [
      {
        title: "顔まわりを、ひと束だけ整える",
        body: "全部を直さなくても、目に入りやすい一束が整うと気分まで軽くなります。",
        steps: ["耳の前の毛を細くひと束取る", "指先にごく少量のバームを広げる", "毛先だけをそっとまとめる"],
      },
      {
        title: "分け目を指でふんわり戻す",
        body: "道具を増やさず、いつもの髪に少しだけ空気を入れるアイデアです。",
        steps: ["分け目の根元に指を入れる", "左右へ小さく揺らして空気を入れる", "触るのはそこでおしまい"],
      },
    ],
    brow: [
      {
        title: "眉尻だけ、30秒整える",
        body: "眉全体を描き直さず、終わりだけ丁寧にすると自然にまとまります。",
        steps: ["スクリューブラシで毛流れを整える", "足りないところを1、2本だけ描く", "指で境目を軽くぼかす"],
      },
      {
        title: "眉頭を一度だけとかす",
        body: "描き足す前に毛流れを整えるだけ。今の眉をそのまま活かせます。",
        steps: ["ブラシを眉頭に当てる", "斜め上へ一度だけとかす", "左右差は追いかけずに終える"],
      },
    ],
    color: [
      {
        title: "唇の中央に、ツヤをひと粒",
        body: "色を重ねすぎず、光だけを足すとさりげなく気分が上がります。",
        steps: ["手持ちのリップを薄く塗る", "中央だけに透明なツヤを置く", "上下の唇を軽く合わせる"],
      },
      {
        title: "好きな色を、頬にうすく戻す",
        body: "似合う色探しは休んで、今日好きだと思える色を少しだけ使います。",
        steps: ["色を指先かブラシに少量取る", "頬の高いところに一度置く", "輪郭だけをやさしくぼかす"],
      },
    ],
    photo: [
      {
        title: "窓のほうを向いて、ひと呼吸",
        body: "表情を作るより、呼吸をほどくほうが自然な一枚になりやすいです。",
        steps: ["窓の正面か少し斜めに立つ", "肩を一度上げて、ふっと下ろす", "息を吐いたあとに一枚だけ撮る"],
      },
      {
        title: "一枚だけ撮る、と先に決める",
        body: "枚数を増やさないことも、自分を見すぎないためのやさしい工夫です。",
        steps: ["カメラを目線の少し上に置く", "好きな音楽を一曲かける", "一枚撮ったらカメラを閉じる"],
      },
    ],
  },
  fresh: {
    hair: [
      {
        title: "分け目を1cmだけずらす",
        body: "長さもスタイルも変えずに、いつもの自分を少し新鮮に見せられます。",
        steps: ["指先で今の分け目を取る", "左右どちらかへ1cm動かす", "根元だけ軽くなじませる"],
      },
      {
        title: "毛先の向きを一か所だけ変える",
        body: "全体を巻かなくても、小さな動きがひとつあると軽やかな印象になります。",
        steps: ["顔まわりの毛をひと束取る", "毛先だけを外側へ流す", "反対側は無理に揃えない"],
      },
    ],
    brow: [
      {
        title: "眉マスカラを、毛先だけにひと撫で",
        body: "形を変えず、質感だけを軽くすると目元の空気が変わります。",
        steps: ["ブラシの余分な液を落とす", "眉の中央から毛先へ一度塗る", "眉頭には足さずに終える"],
      },
      {
        title: "眉尻に、いつもより淡い色を使う",
        body: "強く描き足すのではなく、色の重さを少し抜くアイデアです。",
        steps: ["手持ちの淡いパウダーを取る", "眉尻のすき間だけに置く", "ブラシで一度なじませる"],
      },
    ],
    color: [
      {
        title: "頬と唇を、同じ色でつなぐ",
        body: "新しいコスメがなくても、色をひとつに絞るとすっきりまとまります。",
        steps: ["好きなリップを指先に取る", "頬へごく薄くなじませる", "同じ色を唇にも重ねる"],
      },
      {
        title: "目元に、透明な光を一点だけ",
        body: "華やかに盛るより、光る場所を絞ると新鮮な抜け感が出ます。",
        steps: ["細かいパールを少量取る", "上まぶたの中央にだけ置く", "広げず、その一点で終える"],
      },
    ],
    photo: [
      {
        title: "カメラを、目線より少し上へ",
        body: "ポーズを頑張らず、カメラの位置だけを変える気軽な試し方です。",
        steps: ["スマホを目線より少し高く持つ", "あごは動かさずレンズを見る", "好きな表情で一枚だけ撮る"],
      },
      {
        title: "正面をやめて、光へ少し向く",
        body: "顔を変えようとせず、立つ向きだけで写真の空気を変えます。",
        steps: ["明るい方向を見つける", "体を光へ少しだけ向ける", "肩の力を抜いて撮る"],
      },
    ],
  },
  play: {
    hair: [
      {
        title: "小さなピンを、ひとつだけ足す",
        body: "完璧にセットせず、好きな色や形を一点だけ楽しむ提案です。",
        steps: ["今日気になるピンをひとつ選ぶ", "耳の少し上で留める", "左右対称にせず、そのまま出かける"],
      },
      {
        title: "毛先に、いつもと逆の動きを作る",
        body: "似合うかどうかより、ちょっと面白いと思える変化を楽しみます。",
        steps: ["髪をひと束だけ取る", "いつもと逆方向へ毛先を流す", "気に入ったらそこで完成"],
      },
    ],
    brow: [
      {
        title: "眉に、ほんの少し透ける色を重ねる",
        body: "形はそのまま。手持ちの色で、いつもの眉に遊びを足します。",
        steps: ["淡いピンクかオレンジを少量取る", "眉の中央にだけ重ねる", "ブラシで一度とかしてなじませる"],
      },
      {
        title: "眉頭の毛流れを、少しだけ立てる",
        body: "大きく形を変えず、質感の違いを楽しむ小さなアレンジです。",
        steps: ["透明ジェルをブラシに少量取る", "眉頭を斜め上へとかす", "中央から先は普段どおりにする"],
      },
    ],
    color: [
      {
        title: "目尻に、好きな色をひと点",
        body: "正解の色ではなく、今日見てうれしい色を選んでみます。",
        steps: ["好きな色をひとつ決める", "目尻へ細く短く置く", "ほかはいつものメイクで終える"],
      },
      {
        title: "ツヤとマットを、ひとつずつ選ぶ",
        body: "質感を混ぜるだけで、色を増やさなくても遊びが生まれます。",
        steps: ["唇はツヤ、頬はマットなど組み合わせる", "それぞれ少量ずつ使う", "追加したくなっても一度そこで止める"],
      },
    ],
    photo: [
      {
        title: "好きなものを、写真に一緒に入れる",
        body: "顔だけを見つめず、今日好きなものごと一枚に残します。",
        steps: ["花、本、飲み物からひとつ選ぶ", "画面の端に一緒に入れる", "その日の空気を一枚だけ撮る"],
      },
      {
        title: "少し動きながら、一枚だけ撮る",
        body: "止まって整え続けず、動きの中の表情を楽しむ提案です。",
        steps: ["好きな曲を流す", "肩や髪を少し動かす", "タイマーで一枚だけ撮る"],
      },
    ],
  },
};

const focusKeys = ["hair", "brow", "color", "photo"];
let selectedMood = "calm";
let selectedFocus = "random";
let shownFocus = "hair";
let recipeIndex = 0;
let lightContext = null;
let landmarkerPromise = null;
let visionModulePromise = null;
let stream = null;

function setStatus(message = "") {
  els.status.textContent = message;
}

function setRadioGroup(buttons, selected) {
  buttons.forEach((button) => {
    const active = button === selected;
    button.classList.toggle("is-selected", active);
    button.setAttribute("aria-checked", String(active));
  });
}

function chooseRandomFocus(exclude = null) {
  const choices = focusKeys.filter((key) => key !== exclude);
  return choices[Math.floor(Math.random() * choices.length)];
}

function getRecipe() {
  return recipes[selectedMood][shownFocus][recipeIndex % recipes[selectedMood][shownFocus].length];
}

function renderSuggestion({ keepFocus = false } = {}) {
  if (!keepFocus) {
    shownFocus = selectedFocus === "random" ? chooseRandomFocus() : selectedFocus;
    recipeIndex = 0;
  }

  const recipe = getRecipe();
  els.result.dataset.mood = selectedMood;
  els.resultTitle.textContent = recipe.title;
  els.resultBody.textContent = recipe.body;
  els.steps.replaceChildren(
    ...recipe.steps.map((step) => {
      const item = document.createElement("li");
      item.textContent = step;
      return item;
    })
  );
  els.timeMeta.textContent = "3分以内";
  els.toolMeta.textContent = "手持ちのものでOK";

  const lightMessages = {
    dim: "写真の光は少し控えめでした。撮るなら窓の正面へ移るだけで十分です。",
    bright: "写真の光は少し強めでした。撮るなら窓から半歩離れるとやわらかくなります。",
    soft: "写真の光はちょうど穏やか。これ以上、明るさを調整しなくて大丈夫です。",
  };
  els.lightTip.hidden = !lightContext;
  els.lightTip.textContent = lightContext ? lightMessages[lightContext] : "";

  els.done.hidden = true;
  els.result.hidden = false;
  els.chooseThis.textContent = "これにする";
  els.chooseThis.disabled = false;
  setStatus("");
  els.result.scrollIntoView({ behavior: "smooth", block: "start" });
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  els.video.srcObject = null;
  els.video.hidden = true;
  els.shoot.hidden = true;
}

function closeCameraStage() {
  stopCamera();
  els.cameraStage.hidden = true;
  els.canvas.hidden = true;
  els.placeholder.hidden = false;
}

async function ensureLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      visionModulePromise ||= import(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/vision_bundle.mjs"
      );
      const { FaceLandmarker, FilesetResolver } = await visionModulePromise;
      const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm"
      );
      return FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        numFaces: 1,
      });
    })();
  }
  return landmarkerPromise;
}

async function startCamera() {
  setStatus("");
  els.cameraStage.hidden = false;
  els.placeholder.hidden = false;
  els.placeholder.textContent = "カメラを準備しています";
  els.canvas.hidden = true;
  els.cameraStage.scrollIntoView({ behavior: "smooth", block: "center" });

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 960 } },
      audio: false,
    });
    els.video.srcObject = stream;
    await els.video.play();
    els.placeholder.hidden = true;
    els.video.hidden = false;
    els.shoot.hidden = false;
  } catch (error) {
    console.error(error);
    closeCameraStage();
    setStatus("カメラを開けませんでした。写真なしでも同じ提案を楽しめます。");
  }
}

function drawVideoFrame() {
  const width = els.video.videoWidth;
  const height = els.video.videoHeight;
  if (!width || !height) return;
  const context = els.canvas.getContext("2d");
  els.canvas.width = width;
  els.canvas.height = height;
  context.save();
  context.translate(width, 0);
  context.scale(-1, 1);
  context.drawImage(els.video, 0, 0, width, height);
  context.restore();
  stopCamera();
  els.canvas.hidden = false;
  analyzePhoto(els.canvas);
}

function loadFile(file) {
  const image = new Image();
  image.onload = () => {
    els.cameraStage.hidden = false;
    els.placeholder.hidden = true;
    els.canvas.hidden = false;
    const maxSide = 1280;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    els.canvas.width = Math.round(image.naturalWidth * scale);
    els.canvas.height = Math.round(image.naturalHeight * scale);
    els.canvas.getContext("2d").drawImage(image, 0, 0, els.canvas.width, els.canvas.height);
    URL.revokeObjectURL(image.src);
    analyzePhoto(els.canvas);
  };
  image.onerror = () => setStatus("写真を読み込めませんでした。写真なしでも利用できます。");
  image.src = URL.createObjectURL(file);
}

function measureFaceLight(canvas, landmarks) {
  const xs = landmarks.map((point) => point.x);
  const ys = landmarks.map((point) => point.y);
  const left = Math.max(0, Math.floor(Math.min(...xs) * canvas.width));
  const right = Math.min(canvas.width, Math.ceil(Math.max(...xs) * canvas.width));
  const top = Math.max(0, Math.floor(Math.min(...ys) * canvas.height));
  const bottom = Math.min(canvas.height, Math.ceil(Math.max(...ys) * canvas.height));
  const width = Math.max(1, right - left);
  const height = Math.max(1, bottom - top);
  const data = canvas.getContext("2d").getImageData(left, top, width, height).data;
  const stride = Math.max(4, Math.floor(data.length / 16000 / 4) * 4);
  let total = 0;
  let count = 0;
  for (let index = 0; index < data.length; index += stride) {
    total += 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
    count += 1;
  }
  const brightness = total / count / 255;
  if (brightness < 0.34) return "dim";
  if (brightness > 0.78) return "bright";
  return "soft";
}

async function analyzePhoto(canvas) {
  setStatus("写真の光を確認しています…");
  try {
    const landmarker = await ensureLandmarker();
    const result = landmarker.detect(canvas);
    if (!result.faceLandmarks?.length) {
      setStatus("顔を見つけられませんでした。写真なしで提案を表示します。");
      lightContext = null;
    } else {
      lightContext = measureFaceLight(canvas, result.faceLandmarks[0]);
      setStatus("");
    }
    renderSuggestion();
  } catch (error) {
    console.error(error);
    lightContext = null;
    setStatus("写真の確認ができなかったため、写真なしの提案を表示します。");
    renderSuggestion();
  }
}

els.moodOptions.forEach((button) => {
  button.addEventListener("click", () => {
    selectedMood = button.dataset.mood;
    setRadioGroup(els.moodOptions, button);
  });
});

els.focusOptions.forEach((button) => {
  button.addEventListener("click", () => {
    selectedFocus = button.dataset.focus;
    setRadioGroup(els.focusOptions, button);
  });
});

els.noPhoto.addEventListener("click", () => {
  lightContext = null;
  closeCameraStage();
  renderSuggestion();
});

els.startCam.addEventListener("click", startCamera);
els.pickPhoto.addEventListener("click", () => els.file.click());
els.shoot.addEventListener("click", drawVideoFrame);
els.cancelPhoto.addEventListener("click", () => {
  closeCameraStage();
  lightContext = null;
  renderSuggestion();
});
els.file.addEventListener("change", (event) => {
  const [file] = event.target.files || [];
  if (file) loadFile(file);
  event.target.value = "";
});

els.another.addEventListener("click", () => {
  if (selectedFocus === "random") {
    shownFocus = chooseRandomFocus(shownFocus);
    recipeIndex = 0;
  } else {
    recipeIndex += 1;
  }
  renderSuggestion({ keepFocus: true });
});

els.chooseThis.addEventListener("click", () => {
  els.chooseThis.textContent = "これで十分";
  els.chooseThis.disabled = true;
  els.finish.focus();
});

els.finish.addEventListener("click", () => {
  closeCameraStage();
  els.result.hidden = true;
  els.done.hidden = false;
  els.done.scrollIntoView({ behavior: "smooth", block: "center" });
});

els.restart.addEventListener("click", () => {
  els.done.hidden = true;
  document.querySelector(".picker").scrollIntoView({ behavior: "smooth", block: "start" });
});

window.addEventListener("pagehide", stopCamera);

if (new URLSearchParams(location.search).has("debug")) {
  window.__faceGlowup = { renderSuggestion, loadFile };
}
