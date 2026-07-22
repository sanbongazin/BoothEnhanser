# Handoff: BoothEnhanser ロゴ & UI刷新

## Overview

BOOTH好きリストページに挿入する拡張機能「BoothEnhanser」向けの、ロゴマークと3画面(ポップアップ/オプション/ページ内注入ウィジェット)の刷新デザイン。既存の `src/content/content.css` の配色・構造をベースに、ブランドロゴと独自アクセントカラー(インディゴ)を追加した。

## About the Design Files

同梱の `BoothEnhanser Logo UI.dc.html` は**デザインリファレンス(HTMLモックアップ)**であり、そのままプロダクションコードとして組み込むものではない。実装時は、このHTMLの見た目・構造を本リポジトリの既存スタック(Vanilla TS + `content.css` の `.be-` プレフィックス方式、`popup`/`options` の素のHTML+CSS+TS構成)に沿って再実装すること。

## Fidelity

**High-fidelity**: 色・タイポグラフィ・レイアウト比率は最終案として確定している。ロゴSVGはそのまま使用可能(パス値はモックアップ内に記載)。

## Design Tokens

既存トークン(`content.css` の `:root` を維持):

- `--be-text`: `#252f3d`
- `--be-text-muted`: `#666666`
- `--be-text-tab-inactive`: `#474747`
- `--be-link`: `#1b7f8c`
- `--be-accent` (BOOTHブランドレッド、ピックアップ/CTA用途は既存のまま): `#fc4d50`
- `--be-tab-bg-active`: `#252f3d`
- `--be-tab-bg-inactive`: `rgba(0,0,0,0.04)`
- `--be-border`: `rgba(0,0,0,0.08)`

新規追加トークン:

- `--be-brand-accent`(ロゴ・検索アイコン・ポップアップCTA用の独自アクセント): `oklch(0.58 0.13 255)` (インディゴ)。16進近似値: `#4f6fd6` 程度(実装時に環境のoklch対応を確認し、非対応環境は近似hexにフォールバック)。

フォント: 既存の `--be-font` スタックをそのまま使用(`-apple-system, "system-ui", Avenir, "Helvetica Neue", "Segoe UI", Arial, "ヒラギノ角ゴ ProN", "Hiragino Kaku Gothic ProN", メイリオ, Meiryo, "ＭＳ Ｐゴシック", sans-serif`)。

## ロゴ

- モチーフ: 角丸スクエア(`#252f3d`)の中に、インディゴのドット+チェックマーク(タグに"整備済み/確認済み"のチェックが入ったイメージ)。
- SVG(56x56 viewBox):
  ```html
  <svg width="56" height="56" viewBox="0 0 56 56">
    <rect x="4" y="4" width="48" height="48" rx="14" fill="#252f3d" />
    <circle cx="18" cy="18" r="4" fill="#4f6fd6" />
    <polyline
      points="18,30 25,37 38,20"
      fill="none"
      stroke="#4f6fd6"
      stroke-width="4"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
  ```
- ワードマーク: "BoothEnhanser"、`font-weight:700`, `font-size:22px`(ロックアップ時)、色 `#252f3d`。
- タグライン(任意、ポップアップ等で使用): 「好きリストを、整えて選ぶ。」`font-size:12.5px`, 色 `#666`。
- 用途別サイズ: ロックアップ56px、ポップアップヘッダー20px、favicon/拡張機能アイコンは48/128px等で同ロゴをスケール。

## Screens / Views

### 1. Popup (`src/popup/`)

- **Purpose**: キャッシュ件数の確認、再スキャン、設定画面への導線。
- **Layout**: 幅240px→280px程度に拡張。padding 14〜16px。縦積みflex, gap 10px。
- **Components**:
  - ヘッダー: ロゴ(20px)+ワードマーク(13px, bold, `#252f3d`)、flex横並びgap 6px。
  - キャッシュ件数テキスト: `font-size:11px`, 色 `#666`。
  - 再スキャンボタン: 背景 `#4f6fd6`、文字色 `#fff`、`border-radius:6px`、`padding:7px 0`、`font-size:12px`、中央揃え、hover: 明度を少し下げる。
  - 詳細設定リンク: `#1b7f8c`、hover `#145f69`。

### 2. Options (`src/options/`)

- **Purpose**: 読み仮名の手動オーバーライド編集、キーワード辞書の参照。
- **Layout**: 幅720px程度のカード、padding 16〜22px。
- **Components**:
  - セクション見出し「読み仮名の手動オーバーライド」: `font-size:12px`, bold, `#252f3d`。
  - テーブル行: 商品名/ショップ名/読みをflexまたはtableで表示、区切り線 `1px solid rgba(0,0,0,0.08)`。
  - セクション見出し「判定キーワード辞書」: 同上スタイル。
  - キーワード羅列テキスト: `font-size:10-11px`, 色 `#666`。

### 3. ページ内注入ウィジェット (`src/content/index.ts` + `content.css`)

既存構造(`be-tabs`, `be-controls`, `be-search`, `be-sort-control`, `be-grid`, `be-card` 等)は維持しつつ、以下を変更:

- 検索欄の右側アイコン: 虫眼鏡アイコンをインディゴ(`#4f6fd6`)に変更(現状無地の場合は追加)。SVG:
  ```html
  <svg width="13" height="13" viewBox="0 0 24 24">
    <circle cx="10" cy="10" r="7" fill="none" stroke="#4f6fd6" stroke-width="2.5" />
    <line
      x1="15"
      y1="15"
      x2="21"
      y2="21"
      stroke="#4f6fd6"
      stroke-width="2.5"
      stroke-linecap="round"
    />
  </svg>
  ```
- 「ピックアップ!」バブル(`.be-pickup-bubble`)の背景色をブランドアクセント `#4f6fd6` に変更(現状 `--be-accent` の赤を流用している場合)。BOOTH本来のCTA/R-18バッジ等、BOOTH文脈の要素は既存の赤(`#fc4d50`)のまま維持し、拡張機能固有の要素(検索・ピックアップ)にのみ新アクセントを使う、という切り分け。
- タブ・並び替えセレクトのスタイルは現状維持。

## Interactions & Behavior

- 既存のタブ切替・検索(IME対応debounce)・ソート・カード描画ロジックは変更なし。UIトークンの差し替えのみ。
- ポップアップの再スキャンボタン: クリックで `RESCAN_REQUESTED` メッセージ送信(既存ロジック維持)。

## Assets

- ロゴSVGは上記に埋め込みのパス値のみで完結(外部画像アセットなし)。拡張機能アイコン(16/48/128px)はこのSVGを元にPNG書き出しが必要(実装時に生成)。

## Files

- `BoothEnhanser Logo UI.dc.html` — デザインモックアップ本体(ロゴ、ポップアップ、オプション、注入ウィジェットの静止プレビュー)。
