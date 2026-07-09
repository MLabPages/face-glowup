# 垢抜けチェック(face-glowup)

顔をカメラで写す(または写真を選ぶ)と、顔のパーツ配置から
「印象の特徴」と「垢抜けのヒント」を提示する Web アプリ。

公開URL: https://mlabpages.github.io/face-glowup/

## 設計方針

- **写真・映像は保存も送信もしない**。解析はすべてブラウザ内で完結する
- 顔ランドマーク検出は MediaPipe Tasks Vision(CDN 読み込み)を使用
- ビルド不要の静的サイト(index.html / app.js / styles.css)

## 解析している指標

- 顔の縦横比(面長/丸み の傾向)
- 目の間隔(目1つ分を基準にした比率)
- 眉と目の距離・眉の角度
- 左右対称性(撮影角度の助言に使用)
- 頬付近の明るさ(写真の撮り方の助言に使用)

指標は「良し悪しの採点」ではなく、印象の傾向とすぐ試せる工夫の提案に使う。

## デプロイ

main ブランチに push すると `.github/workflows/pages.yml` が
GitHub Pages へ自動デプロイする(reaction-meter と同じ方式)。
