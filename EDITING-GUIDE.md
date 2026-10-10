# KaN Portfolio 編集ガイド

このサイトはビルド不要の静的サイトです。HTML・CSS・JavaScriptを保存し、ブラウザを再読み込みすれば変更を確認できます。

## ページとファイル

| ファイル | 内容 |
| --- | --- |
| `index.html` | トップ、制作実績、Requestへの入口 |
| `about.html` | About、How I Work |
| `thumbnail.html` | サムネイル実績 |
| `others.html` | その他の実績 |
| `request.html` | 制作相談・料金確認・依頼の案内と外部Request Webへの入口 |
| `consultation.html` | 旧相談URLからRequestへの統合案内 |
| `opening-ending.html` | オープニング・エンディング制作（掲載準備中） |
| `discord-server.html` | Discordサーバー制作（掲載準備中） |
| `styles.css` | 全ページ共通のデザイン |
| `request.css` | Request案内ページ専用デザイン |
| `script.js` | メニュー、3D、実績フィルター、画像拡大など |

## よく編集する場所

### 制作実績を変更する

`index.html` の `class="grid"` 内にある `article class="work"` が1件分です。

- `data-type="web"`：Webフィルターに表示
- `<img src="...">`：表示画像
- `<h3>`：実績名
- `<p>`：説明
- `<small>`：カテゴリ名

実績数を増減した場合は、同じセクション上部のフィルターボタンにある件数も変更してください。

### 画像を変更する

画像は `assets/` に保存し、HTMLの `src="assets/ファイル名"` を変更します。

### 色を変更する

`styles.css` 冒頭の `:root` に主要色があります。

```css
--orange: #ff5a1f;
--black: #111;
--charcoal: #202020;
--paper: #f4f2ed;
```

### Requestについて

`request.html` は案内ページです。料金シミュレーション・相談・依頼の受付は外部Request Webに統合しています。外部URLを変更する場合は、`request.html` の「Request Webを開く」リンクを変更してください。

## コードを再整形する

Node.jsを使用できる環境では、初回のみ `npm install` を実行したあと、次のコマンドで全ファイルを再整形できます。

```sh
npm run format
```
