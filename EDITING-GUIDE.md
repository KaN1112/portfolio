# KaN Portfolio 編集ガイド

このサイトはビルド不要の静的サイトです。HTML・CSS・JavaScriptを保存し、ブラウザを再読み込みすれば変更を確認できます。

## ページとファイル

| ファイル | 内容 |
| --- | --- |
| `index.html` | トップ、制作実績、依頼・相談への入口 |
| `about.html` | About、How I Work |
| `thumbnail.html` | サムネイル実績 |
| `others.html` | その他の実績 |
| `request.html` | 料金シミュレーター、制作依頼フォーム |
| `consultation.html` | 相談専用フォーム |
| `styles.css` | 全ページ共通のデザイン |
| `request.css` | 料金シミュレーター専用デザイン |
| `intro.js` | 初回表示の3Dタイトルイントロ |
| `script.js` | メニュー、3D、実績フィルター、画像拡大など |
| `request.js` | 料金計算と依頼ページの操作 |

## よく編集する場所

### 制作実績を変更する

`index.html` の `class="grid"` 内にある `article class="work"` が1件分です。

- `data-type="web"`：Webフィルターに表示
- `data-type="bot"`：Discord Botフィルターに表示
- `<img src="...">`：表示画像
- `<h3>`：実績名
- `<p>`：説明
- `<small>`：カテゴリ名

実績数を増減した場合は、同じセクション上部のフィルターボタンにある件数も変更してください。

### 画像を変更する

画像は `assets/` に保存し、HTMLの `src="assets/ファイル名"` を変更します。Bot画像には `bot-shot` クラスを付けると、トリミングせず全面表示されます。

### 色を変更する

`styles.css` 冒頭の `:root` に主要色があります。

```css
--orange: #ff5a1f;
--black: #111;
--charcoal: #202020;
--paper: #f4f2ed;
```

### 料金を変更する

料金計算は `request.js` 冒頭の `pricing` にまとまっています。画面に直接書かれている料金表記も `request.html` で合わせて変更してください。

### フォームについて

制作依頼は `request.html`、相談は `consultation.html` です。どちらも現在のFormspree送信先を使用しています。`action`、`method`、各入力欄の `name` は送信内容に影響するため、目的がない限り変更しないでください。

## コードを再整形する

Node.jsを使用できる環境では、初回のみ `npm install` を実行したあと、次のコマンドで全ファイルを再整形できます。

```sh
npm run format
```
