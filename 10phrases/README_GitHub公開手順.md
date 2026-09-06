# 状況別・恋愛オーダー10フレーズ集｜GitHub Pages公開手順

診断サイト（愛される周波数タイプ診断）と同じく、**静的HTMLをGitHub Pagesで公開**する手順です。

---

## このフォルダの中身

| ファイル | 役割 |
|---|---|
| `index.html` | サイト本体 |
| `styles.css` | 診断と同系のピンク×パープル |
| `phrases-data.js` | フレーズ・照合表データ |
| `app.js` | 画面遷移 |
| `images/cover.png` | カバー画像 |

ローカル確認：`index.html` をブラウザで開く（またはフォルダで `python3 -m http.server 8080`）

---

## GitHubで新規サイトを作る（最短）

### 1. GitHubにログイン

https://github.com にログイン

### 2. 新しいリポジトリを作成

1. 右上 **+** → **New repository**
2. Repository name 例：`love-order-10phrases`
3. **Public** を選ぶ（Pagesを無料公開するため）
4. 「Add a README」は**チェック不要**（後でファイルを上げる）
5. **Create repository**

### 3. このフォルダのファイルをアップロード

方法A（ブラウザだけ・かんたん）

1. 作ったリポジトリを開く
2. **Add file** → **Upload files**
3. 次をすべてドラッグ＆ドロップ  
   `index.html` / `styles.css` / `phrases-data.js` / `app.js` / `images` フォルダ
4. **Commit changes**

方法B（ターミナル）

```bash
cd "/Users/tozakikaito/Downloads/特典サイト_恋愛オーダー10フレーズ"
git init
git add .
git commit -m "Initial commit: love order 10 phrases benefit site"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/love-order-10phrases.git
git push -u origin main
```

※ `あなたのユーザー名` とリポジトリ名は実際のものに差し替え

### 4. GitHub Pagesを有効化

1. リポジトリの **Settings**
2. 左メニュー **Pages**
3. **Build and deployment** → Source：**Deploy from a branch**
4. Branch：**main** / Folder：**/ (root)**
5. **Save**

数分待つと公開URLが出ます。

```
https://あなたのユーザー名.github.io/love-order-10phrases/
```

### 5. LINE・特典配布に貼る

申込特典のリンクに、上記URLをそのまま貼る。

---

## 診断サイトと同じ色味（確認用）

| トークン | 色 |
|---|---|
| ピンク | `#ff6b9d` |
| パープル | `#7c5cff` |
| 背景 | `#fff7fa` |
| テキスト | `#2b2430` |
| 線 | `#f0dce6` |

---

## 更新のしかた

文言やフレーズを直したら、同じファイルを再度 Upload（または `git push`）。  
Pagesは通常1〜2分で反映されます。強キャッシュ時はURL末尾に `?v=2` を付ける。
