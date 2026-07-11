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
  resultCategory: document.getElementById("resultCategory"),
  resultMood: document.getElementById("resultMood"),
  resultTitle: document.getElementById("resultTitle"),
  resultBody: document.getElementById("resultBody"),
  photoInsight: document.getElementById("photoInsight"),
  insightTitle: document.getElementById("insightTitle"),
  insightBody: document.getElementById("insightBody"),
  steps: document.getElementById("steps"),
  techniqueLabel: document.getElementById("techniqueLabel"),
  techniqueValue: document.getElementById("techniqueValue"),
  moodTechnique: document.getElementById("moodTechnique"),
  timeMeta: document.getElementById("timeMeta"),
  toolMeta: document.getElementById("toolMeta"),
  lightTip: document.getElementById("lightTip"),
  chooseThis: document.getElementById("chooseThis"),
  another: document.getElementById("another"),
  finish: document.getElementById("finish"),
  done: document.getElementById("done"),
  restart: document.getElementById("restart"),
};

const faceAwareRecipes = {
  hair: {
    soft: {
      title: "トップに、ひと息ぶん空気を入れる",
      body: "輪郭のやわらかさはそのままに、髪の上側へ軽さをひとつ足します。",
      steps: ["分け目の根元に指を入れる", "左右へ小さく揺らして空気を入れる", "顔まわりは触りすぎず、そこで終える"],
    },
    sleek: {
      title: "顔まわりを、横へひと流し",
      body: "すっきりした縦の流れを活かしながら、顔まわりにやわらかな動きを足します。",
      steps: ["耳の前の毛を細くひと束取る", "毛先だけを外側へ流す", "少量のバームで動きを残す"],
    },
    smooth: {
      title: "分け目を1cmだけ動かす",
      body: "なめらかな輪郭を活かして、髪の入り口だけを少し新鮮にします。",
      steps: ["今の分け目を指で取る", "好きな側へ1cmだけ動かす", "根元を軽くなじませて完成"],
    },
  },
  brow: {
    lifted: {
      title: "眉尻を細く整えて、流れを活かす",
      body: "すっと上向く眉の流れを消さず、終わりだけを軽く整えます。",
      steps: ["眉を毛流れに沿ってとかす", "眉尻の足りないところを1、2本だけ描く", "境目を一度ぼかして終える"],
    },
    gentle: {
      title: "眉を一度とかして、やわらかく整える",
      body: "穏やかな眉の流れをそのまま活かす、描き足しすぎない方法です。",
      steps: ["眉頭から中央までを斜め上へとかす", "眉尻は横へ自然に流す", "色は足りない部分にだけ置く"],
    },
    natural: {
      title: "眉尻だけ、30秒整える",
      body: "自然な眉の流れを活かして、目に入りやすい終わりだけを丁寧にします。",
      steps: ["スクリューブラシで全体をとかす", "眉尻を1、2本だけ描き足す", "左右差は追いかけずに終える"],
    },
  },
  color: {
    open: {
      title: "目頭に、小さな光をひとつ",
      body: "やさしく広がる目元の雰囲気を活かし、視線の中心にごく小さな光を足します。",
      steps: ["細かいパールをほんの少し取る", "目頭へ点のように置く", "広げすぎず、その一点で終える"],
    },
    focused: {
      title: "目尻に、好きな色を短くひと筋",
      body: "視線を引き込む目元を活かして、外側に少しだけ色の余韻を作ります。",
      steps: ["今日うれしいと思える色を選ぶ", "目尻へ細く短く置く", "ほかはいつものメイクのままにする"],
    },
    clear: {
      title: "まぶた中央に、光を一点",
      body: "すっと目に入る目元の流れを活かして、中央だけに軽いツヤを足します。",
      steps: ["細かいパールを少量取る", "黒目の上へ指で一度置く", "左右を何度も見比べずに終える"],
    },
  },
  photo: {
    dim: {
      title: "窓の正面へ、一歩だけ近づく",
      body: "今の表情は変えず、光の届き方だけを少し整えます。",
      steps: ["窓か明るい壁の正面へ移る", "肩を一度上げて、ふっと下ろす", "息を吐いたあとに一枚だけ撮る"],
    },
    bright: {
      title: "窓から半歩離れて、光をやわらげる",
      body: "顔を変えようとせず、強い光だけを少し穏やかにします。",
      steps: ["窓から半歩だけ離れる", "直射ではなく明るい壁の方を向く", "明るさを触らず一枚だけ撮る"],
    },
    soft: {
      title: "今の光のまま、一枚だけ撮る",
      body: "光が穏やかに届いています。これ以上の調整は増やさなくて大丈夫です。",
      steps: ["カメラを目線の少し上へ置く", "息をゆっくり吐く", "好きな表情で一枚だけ撮る"],
    },
  },
};

const faceAwareAlternates = {
  hair: {
    soft: {
      title: "頬骨の下から、顔まわりを外へ逃がす",
      body: "輪郭のやわらかさを残しつつ、下側に細い動きを作って軽さを加えます。",
      steps: ["耳前の毛を1cm幅だけ取る", "頬骨の少し下から外向きに半回転させる", "毛束を指で二つに割り、線を細くする"],
    },
    sleek: {
      title: "前髪を狭く取り、横へつなげる",
      body: "縦のラインを活かしながら、額から頬へ横のつながりを作ります。",
      steps: ["前髪の中央は薄く残す", "両端をこめかみ側へ流す", "頬骨付近の毛と自然につなげる"],
    },
    smooth: {
      title: "片側だけ耳にかけて、線を見せる",
      body: "なめらかな輪郭に左右差をひとつ加え、頑張りすぎない立体感を作ります。",
      steps: ["好きな側だけを耳にかける", "反対側は頬に沿う毛を少し残す", "耳まわりの表面だけを薄く整える"],
    },
  },
  brow: {
    lifted: {
      title: "眉頭を透かし、中央から眉尻へ濃淡を置く",
      body: "上向きの流れはそのままに、色の重心を外側へ移して洗練さを足します。",
      steps: ["眉頭1cmはブラシだけで整える", "中央から眉尻にパウダーを置く", "眉尻だけペンシルで細く閉じる"],
    },
    gentle: {
      title: "眉下を1mmだけそろえ、上側は残す",
      body: "穏やかな流れを変えず、下の輪郭だけを薄く整えて立体感を残します。",
      steps: ["眉下の足りない部分だけを見つける", "淡いパウダーで1mm以内に埋める", "上側は描かず、毛流れを残す"],
    },
    natural: {
      title: "眉マスカラを逆毛から、最後に毛流れへ",
      body: "自然な形を変えず、一本ずつの質感と色だけを均一に整えます。",
      steps: ["ブラシの液をティッシュで一度落とす", "中央から眉尻を逆毛方向へ薄く塗る", "眉頭から毛流れに沿って一度とかす"],
    },
  },
  color: {
    open: {
      title: "上まぶたの内側に、淡い締め色を重ねる",
      body: "やさしく広がる目元を活かし、内側にだけ奥行きを足して視線を集めます。",
      steps: ["中間色を黒目の内側へ薄く置く", "目頭へ向けて境目をぼかす", "外側は明るさを残して終える"],
    },
    focused: {
      title: "下まぶたの目尻1/3に、透ける色を置く",
      body: "視線を引き込む目元を活かし、外側に短い色の余韻を作ります。",
      steps: ["淡い色を細いブラシに取る", "下まぶたの目尻1/3だけに置く", "境目を指で一度なじませる"],
    },
    clear: {
      title: "上はツヤ、下はマットで質感を分ける",
      body: "自然な目元の流れを活かし、同系色の質感差だけで奥行きを作ります。",
      steps: ["上まぶた中央へ細かいパールを置く", "下まぶたは同系色のマットを薄く使う", "色を増やさず、質感二つで終える"],
    },
  },
  photo: {
    dim: {
      title: "白い壁を横に置き、影をやわらげる",
      body: "落ち着いた光を残しながら、顔の片側へ反射光だけを足します。",
      steps: ["窓の斜め前に立つ", "顔の暗い側へ白い壁や紙を置く", "露出は上げすぎず一枚撮る"],
    },
    bright: {
      title: "窓に対して45度向き、立体感を残す",
      body: "明るさは活かしつつ、正面からの強い光を少しだけ横へ逃がします。",
      steps: ["窓に対して体を45度向ける", "顔だけをレンズへ少し戻す", "白飛びする時だけ露出を少し下げる"],
    },
    soft: {
      title: "1.2m離れ、目線より5cm上から撮る",
      body: "今のやわらかな光を保ったまま、距離と高さだけで自然な奥行きを作ります。",
      steps: ["カメラと顔を1.2mほど離す", "レンズを目線より5cmほど上へ置く", "デジタルズームは使わず一枚撮る"],
    },
  },
};

const techniqueDetails = {
  hair: {
    soft: ["ドライヤーは根元へ下から3秒。バームは米粒半分を毛先だけに。", "アイロンは普段より10度低めで、耳前1cm幅だけに。"],
    sleek: ["バームは米粒半分。頬より上にはつけず、毛先の線を残す。", "前髪用オイルは1滴未満。中央ではなく両端からなじませる。"],
    smooth: ["根元用ミストは2プッシュまで。表面はさらっと残す。", "オイルは半滴を耳まわりだけ。反対側には足さない。"],
  },
  brow: {
    lifted: ["ペンシルは眉尻2〜3mmだけ。仕上げに透明ジェルを薄く。", "眉頭は無色、中央から眉尻は淡いパウダーを一層だけ。"],
    gentle: ["ジェルはブラシの片面だけに取り、眉頭から中央へ一度通す。", "眉下の描き足しは1mm以内。上側にはパウダーを重ねない。"],
    natural: ["ペンシルは毛がない所に1〜2本。パウダーは境目をぼかす量だけ。", "眉マスカラは容器の口で液を落とし、各眉2ストローク以内。"],
  },
  color: {
    open: ["パールは1mm程度の点。粒の細かいシャンパン系なら光だけが残る。", "締め色はブラシの片面に薄く。黒目の内側から目頭までに限定する。"],
    focused: ["ラインは目尻から2〜3mm。黒より透けるブラウンやカラーが軽い。", "下まぶたは目尻1/3、幅2mm以内。粉を一度払ってから置く。"],
    clear: ["パールは小指の爪半分。黒目の上から動かさず一点に。", "上は微細パール、下はマット。同系色で質感だけを変える。"],
  },
  photo: {
    dim: ["窓から50〜100cm。露出補正は上げても+0.3程度まで。", "白い紙や壁は顔から30〜50cm。影を消し切らず薄く残す。"],
    bright: ["窓から1m以上離れる。白飛びする時だけ露出を-0.3程度に。", "窓に対して45度、カメラは顔から80cm以上離す。"],
    soft: ["カメラは顔から80cm以上。広角の歪みを避け、等倍で撮る。", "距離は約1.2m、高さは目線より約5cm上。等倍レンズを使う。"],
  },
};

const genericTechniqueDetails = {
  hair: "スタイリング剤は米粒半分から。足すなら表面ではなく毛先だけ。",
  brow: "ブラシの余分な粉や液を一度落とし、描き足しは1mm以内から。",
  color: "パールや色は小指の爪半分から。置く範囲を先に決めて広げすぎない。",
  photo: "カメラは顔から80cm以上離し、広角ではなく等倍を基本に。",
};

const moodTechniqueTips = {
  hair: {
    calm: "表面はさらっと、毛先だけに薄いツヤを残す。",
    fresh: "根元はドライ、毛先は軽いツヤにして質感差を作る。",
    play: "色ピンや細いカチューシャは一点だけ。髪の動きは残す。",
  },
  brow: {
    calm: "髪色と同程度か半トーン明るい、透ける色で整える。",
    fresh: "髪色より1トーン明るい色を中央から眉尻へ薄く使う。",
    play: "ピンクやオリーブなどの色は眉中央へ一層だけ重ねる。",
  },
  color: {
    calm: "ベージュやグレージュの微細パールで、光だけを足す。",
    fresh: "ピンクベージュやコーラルを薄く、ツヤは一か所に絞る。",
    play: "ライラックや偏光カラーを一点だけ。ほかは同系色でまとめる。",
  },
  photo: {
    calm: "彩度を上げず、影を少し残すと落ち着いた空気になる。",
    fresh: "露出は+0.3以内、白い服や壁の反射で明るさを足す。",
    play: "好きな色の小物を画面の端へ。顔だけを主役にしすぎない。",
  },
};

const moodClosers = {
  calm: "大きく変えず、一か所だけで十分です。",
  fresh: "いつもより少しだけ新鮮な気分を足せます。",
  play: "正解より、今日好きだと思える方を選んでください。",
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
const focusDisplay = {
  hair: "HAIR / FACE LINE",
  brow: "BROW DESIGN",
  color: "EYE & COLOR",
  photo: "PHOTO DIRECTION",
};
const moodDisplay = {
  calm: "SOFT MOOD",
  fresh: "FRESH MOOD",
  play: "PLAY MOOD",
};
let selectedMood = "calm";
let selectedFocus = "random";
let shownFocus = "hair";
let recipeIndex = 0;
let photoContext = null;
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
  const recipe = recipes[selectedMood][shownFocus][recipeIndex % recipes[selectedMood][shownFocus].length];
  return { ...recipe, technique: genericTechniqueDetails[shownFocus] };
}

function getFaceAwareRecipe() {
  const keys = {
    hair: photoContext.faceLine,
    brow: photoContext.browFlow,
    color: photoContext.eyeFeel,
    photo: photoContext.light,
  };
  const signal = keys[shownFocus];
  const variants = [faceAwareRecipes[shownFocus][signal], faceAwareAlternates[shownFocus][signal]];
  const variantIndex = recipeIndex % variants.length;
  const recipe = variants[variantIndex];
  return {
    ...recipe,
    body: `${recipe.body}${moodClosers[selectedMood]}`,
    technique: techniqueDetails[shownFocus][signal][variantIndex],
  };
}

function getPhotoInsight() {
  if (!photoContext.reliable) {
    return {
      title: "この写真の雰囲気を、そのまま活かします",
      body: "少し角度があるため細かな形は決めつけず、今の気分に合う一案を選びました。",
    };
  }

  const insights = {
    hair: {
      soft: ["やわらかな輪郭が印象的です", "丸みを消さず、髪の空気感を少し足す提案を選びました。"],
      sleek: ["すっきりした輪郭が印象的です", "縦の流れを活かし、顔まわりに横の動きを足す提案を選びました。"],
      smooth: ["なめらかな輪郭が印象的です", "今のバランスを活かし、分け目だけを動かす提案を選びました。"],
    },
    brow: {
      lifted: ["すっと上向く眉の流れが印象的です", "凛とした雰囲気を活かし、眉尻だけを整える提案を選びました。"],
      gentle: ["穏やかな眉の流れが印象的です", "やわらかな雰囲気を活かし、毛流れを整える提案を選びました。"],
      natural: ["自然な眉の流れが印象的です", "今の形を変えず、眉尻だけを丁寧にする提案を選びました。"],
    },
    color: {
      open: ["やさしく広がる目元が印象的です", "その雰囲気を活かし、目頭に小さな光を足す提案を選びました。"],
      focused: ["視線を引き込む目元が印象的です", "印象的な中心はそのままに、目尻へ色を足す提案を選びました。"],
      clear: ["すっと目に入る目元が印象的です", "自然な流れを活かし、まぶた中央に光を足す提案を選びました。"],
    },
    photo: {
      dim: ["落ち着いた光の雰囲気です", "表情はそのまま、光の方向だけを変える提案を選びました。"],
      bright: ["明るく軽やかな光の雰囲気です", "光を少しやわらげ、表情を残しやすくする提案を選びました。"],
      soft: ["やわらかな光が顔に届いています", "今の雰囲気を変えず、一枚だけ撮る提案を選びました。"],
    },
  };
  const [title, body] = insights[shownFocus][{
    hair: photoContext.faceLine,
    brow: photoContext.browFlow,
    color: photoContext.eyeFeel,
    photo: photoContext.light,
  }[shownFocus]];
  return { title, body };
}

function renderSuggestion({ keepFocus = false, preserveStatus = false } = {}) {
  if (!keepFocus) {
    shownFocus = selectedFocus === "random" ? chooseRandomFocus() : selectedFocus;
    recipeIndex = 0;
  }

  const useFaceAwareRecipe = Boolean(photoContext);
  const recipe = useFaceAwareRecipe ? getFaceAwareRecipe() : getRecipe();
  els.result.dataset.mood = selectedMood;
  els.result.dataset.focus = shownFocus;
  els.resultCategory.textContent = focusDisplay[shownFocus];
  els.resultMood.textContent = moodDisplay[selectedMood];
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
  els.techniqueLabel.textContent = shownFocus === "photo" ? "距離・角度" : "量・質感";
  els.techniqueValue.textContent = recipe.technique;
  els.moodTechnique.textContent = moodTechniqueTips[shownFocus][selectedMood];

  if (photoContext) {
    const insight = getPhotoInsight();
    els.insightTitle.textContent = insight.title;
    els.insightBody.textContent = insight.body;
    els.photoInsight.hidden = false;
  } else {
    els.photoInsight.hidden = true;
  }

  const lightMessages = {
    dim: "写真の光は少し控えめでした。撮るなら窓の正面へ移るだけで十分です。",
    bright: "写真の光は少し強めでした。撮るなら窓から半歩離れるとやわらかくなります。",
    soft: "写真の光はちょうど穏やか。これ以上、明るさを調整しなくて大丈夫です。",
  };
  els.lightTip.hidden = !photoContext;
  els.lightTip.textContent = photoContext ? lightMessages[photoContext.light] : "";

  els.done.hidden = true;
  els.result.hidden = false;
  els.chooseThis.textContent = "今日これを試す";
  els.chooseThis.disabled = false;
  if (!preserveStatus) setStatus("");
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

function readFaceContext(canvas, landmarks) {
  const point = (index) => ({
    x: landmarks[index].x * canvas.width,
    y: landmarks[index].y * canvas.height,
  });
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  const top = point(10);
  const chin = point(152);
  const leftCheek = point(234);
  const rightCheek = point(454);
  const nose = point(1);
  const faceWidth = distance(leftCheek, rightCheek);
  const faceHeight = distance(top, chin);
  const faceCenterX = (leftCheek.x + rightCheek.x) / 2;
  const yawOffset = Math.abs(nose.x - faceCenterX) / faceWidth;
  const reliable = yawOffset < 0.11 && faceWidth > canvas.width * 0.16;

  const eyeWidth = (distance(point(33), point(133)) + distance(point(362), point(263))) / 2;
  const eyeSpacing = distance(point(133), point(362)) / eyeWidth;

  const leftBrowLift = point(107).y - point(70).y;
  const rightBrowLift = point(336).y - point(300).y;
  const browLift = (leftBrowLift + rightBrowLift) / 2 / faceHeight;
  const faceRatio = faceHeight / faceWidth;

  return {
    reliable,
    light: measureFaceLight(canvas, landmarks),
    faceLine: !reliable ? "smooth" : faceRatio >= 1.45 ? "sleek" : faceRatio <= 1.28 ? "soft" : "smooth",
    eyeFeel: !reliable ? "clear" : eyeSpacing >= 1.15 ? "open" : eyeSpacing <= 0.9 ? "focused" : "clear",
    browFlow: !reliable ? "natural" : browLift >= 0.025 ? "lifted" : browLift <= -0.005 ? "gentle" : "natural",
  };
}

async function analyzePhoto(canvas) {
  setStatus("写真の雰囲気を確認しています…");
  try {
    const landmarker = await ensureLandmarker();
    const result = landmarker.detect(canvas);
    if (!result.faceLandmarks?.length) {
      setStatus("顔を見つけられませんでした。写真なしで提案を表示します。");
      photoContext = null;
    } else {
      photoContext = readFaceContext(canvas, result.faceLandmarks[0]);
      setStatus("");
    }
    renderSuggestion({ preserveStatus: !photoContext });
  } catch (error) {
    console.error(error);
    photoContext = null;
    setStatus("写真の確認ができなかったため、写真なしの提案を表示します。");
    renderSuggestion({ preserveStatus: true });
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
  photoContext = null;
  closeCameraStage();
  renderSuggestion();
});

els.startCam.addEventListener("click", startCamera);
els.pickPhoto.addEventListener("click", () => els.file.click());
els.shoot.addEventListener("click", drawVideoFrame);
els.cancelPhoto.addEventListener("click", () => {
  closeCameraStage();
  photoContext = null;
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

const debugParams = new URLSearchParams(location.search);
if (debugParams.has("debug")) {
  window.__faceGlowup = { renderSuggestion, loadFile };
  const facePreview = debugParams.get("facePreview");
  if (["soft", "sleek", "smooth"].includes(facePreview)) {
    selectedFocus = "hair";
    shownFocus = "hair";
    photoContext = {
      reliable: true,
      light: "soft",
      faceLine: facePreview,
      eyeFeel: "clear",
      browFlow: "natural",
    };
    renderSuggestion({ keepFocus: true });
  }
}
