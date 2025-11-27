# Claude実装指示書: 紫芳庵お知らせ投稿・表示システム

**作成日**: 2025年11月19日
**対象**: Claude Code AI
**プロジェクト**: 紫芳庵ウェブサイト お知らせ機能実装

---

## 概要

この指示書は、Claudeが紫芳庵ウェブサイトのお知らせ投稿・表示システムを実装するための詳細な手順書です。以下の指示に従って、段階的に機能を実装してください。

---

## 前提条件

### プロジェクト情報
- **作業ディレクトリ**: `/Users/hinotakafumi/Desktop/shihohonn/`
- **Gitリポジトリ**: https://github.com/Regittech/Shihouan_LP.git
- **現在のブランチ**: main
- **技術スタック**: HTML5 + CSS3 + Vanilla JavaScript + JSON
- **デザイン参考**: [news.html](news.html), [news.css](news.css)

### 既存ファイル
- [index.html](index.html) - TOPページ(お知らせ表示箇所あり)
- [news.html](news.html) - お知らせ詳細ページのデザイン参考
- [style.css](style.css) - TOPページスタイル
- [news.css](news.css) - お知らせページスタイル

---

## 実装フェーズ

実装は以下の3つのフェーズに分けて行います:

### Phase 1: データ構造とフロントエンド表示(最優先)
### Phase 2: 管理画面の基本機能
### Phase 3: 高度な機能(画像・予約投稿等)

---

# Phase 1: データ構造とフロントエンド表示

## ステップ1.1: JSONデータファイルの作成

### 指示
`news-data.json` ファイルをプロジェクトルートに作成してください。

### ファイルパス
`/Users/hinotakafumi/Desktop/shihohonn/news-data.json`

### 内容
```json
{
  "news": [
    {
      "id": "news-001",
      "title": "秋のメニューをぜひご賞味ください",
      "slug": "autumn-menu-2025",
      "publishDate": "2025-11-01",
      "publishTime": "09:00",
      "body": "秋の味覚を存分にお楽しみいただける、期間限定の特別メニューをご用意いたしました。\n\n旬の食材を使用した料理の数々を、ぜひご賞味ください。",
      "images": [],
      "status": "published",
      "scheduledDate": null,
      "createdAt": "2025-10-25T14:30:00+09:00",
      "updatedAt": "2025-10-25T14:30:00+09:00"
    }
  ],
  "settings": {
    "adminPasswordHash": "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f",
    "nextId": 2
  }
}
```

### 注意点
- `adminPasswordHash` は `shihouan2025` のSHA-256ハッシュ値です
- `nextId` は次に作成するお知らせのID番号です
- 初期データとして1件のお知らせを含めています

---

## ステップ1.2: フロントエンド表示用JavaScriptの作成

### 指示
`js/news-display.js` ファイルを作成してください。このスクリプトは以下を実行します:
1. `news-data.json` を読み込む
2. 公開済みのお知らせを抽出する
3. TOPページのバッジに最新1件を表示
4. お知らせ一覧に最新5件を表示

### ファイルパス
`/Users/hinotakafumi/Desktop/shihohonn/js/news-display.js`

### 実装内容

```javascript
// news-display.js - お知らせ表示機能

/**
 * お知らせデータを読み込み、フロントエンドに表示する
 */
class NewsDisplay {
  constructor() {
    this.newsData = [];
    this.dataUrl = '/news-data.json';
  }

  /**
   * 初期化処理
   */
  async init() {
    try {
      await this.loadNewsData();
      this.displayLatestBadge();
      this.displayNewsList();
    } catch (error) {
      console.error('お知らせの読み込みに失敗しました:', error);
    }
  }

  /**
   * JSONデータを読み込む
   */
  async loadNewsData() {
    const response = await fetch(this.dataUrl);
    if (!response.ok) {
      throw new Error('データの読み込みに失敗しました');
    }
    const data = await response.json();
    this.newsData = data.news || [];
  }

  /**
   * 公開済みのお知らせを取得(予約投稿の公開日時チェック含む)
   */
  getPublishedNews() {
    const now = new Date();

    return this.newsData.filter(news => {
      // 公開中のお知らせ
      if (news.status === 'published') {
        return true;
      }

      // 予約投稿で公開日時を過ぎたもの
      if (news.status === 'scheduled' && news.scheduledDate) {
        const scheduledDate = new Date(news.scheduledDate);
        return scheduledDate <= now;
      }

      return false;
    }).sort((a, b) => {
      // 日付降順でソート
      const dateA = new Date(a.publishDate + ' ' + a.publishTime);
      const dateB = new Date(b.publishDate + ' ' + b.publishTime);
      return dateB - dateA;
    });
  }

  /**
   * TOPページのバッジに最新1件を表示
   */
  displayLatestBadge() {
    const badgeElement = document.querySelector('.news-badge');
    if (!badgeElement) return;

    const publishedNews = this.getPublishedNews();
    if (publishedNews.length === 0) {
      badgeElement.style.display = 'none';
      return;
    }

    const latest = publishedNews[0];
    const formattedDate = this.formatDate(latest.publishDate);

    badgeElement.innerHTML = `
      <span class="news-badge-new">NEW</span>
      <span class="news-badge-date">${formattedDate}</span>
      <span class="news-badge-text">${this.escapeHtml(latest.title)}</span>
    `;

    // クリックで詳細ページに遷移
    badgeElement.style.cursor = 'pointer';
    badgeElement.onclick = () => {
      window.location.href = `/news/${latest.slug}.html`;
    };
  }

  /**
   * お知らせ一覧に最新5件を表示
   */
  displayNewsList() {
    const listElement = document.querySelector('.notice-list');
    if (!listElement) return;

    const publishedNews = this.getPublishedNews();
    const latestFive = publishedNews.slice(0, 5);

    if (latestFive.length === 0) {
      listElement.innerHTML = '<li class="notice-item"><span class="notice-text">お知らせはありません</span></li>';
      return;
    }

    listElement.innerHTML = latestFive.map(news => {
      const formattedDate = this.formatDate(news.publishDate);
      return `
        <li class="notice-item" data-slug="${news.slug}" style="cursor: pointer;">
          <span class="notice-date">${formattedDate}</span>
          <span class="notice-text">${this.escapeHtml(news.title)}</span>
        </li>
      `;
    }).join('');

    // 各項目にクリックイベントを追加
    listElement.querySelectorAll('.notice-item').forEach(item => {
      item.onclick = () => {
        const slug = item.getAttribute('data-slug');
        window.location.href = `/news/${slug}.html`;
      };
    });
  }

  /**
   * 日付をフォーマット(YYYY/MM/DD形式)
   */
  formatDate(dateString) {
    if (!dateString) return '';
    return dateString.replace(/-/g, '/');
  }

  /**
   * HTMLエスケープ(XSS対策)
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', () => {
  const newsDisplay = new NewsDisplay();
  newsDisplay.init();
});
```

### 注意点
- XSS対策として `escapeHtml()` 関数を使用しています
- 予約投稿の公開日時チェックを含めています
- エラーハンドリングを実装しています

---

## ステップ1.3: index.htmlの修正

### 指示
[index.html](index.html) の以下の箇所を修正してください:

### 修正箇所1: `</body>` タグの直前にスクリプトを追加

```html
<!-- お知らせ表示スクリプト -->
<script src="js/news-display.js"></script>
</body>
```

### 修正箇所2: お知らせ一覧の既存HTMLをそのまま維持

既存の `<ul class="notice-list">` セクションはそのままにしてください。JavaScriptが動的に書き換えます。

---

## ステップ1.4: お知らせ詳細ページテンプレートの作成

### 指示
お知らせ詳細ページのテンプレートを作成してください。このファイルは [news.html](news.html) のデザインを踏襲します。

### ファイルパス
`/Users/hinotakafumi/Desktop/shihohonn/news-detail-template.html`

### 実装内容

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title id="page-title">お知らせ | 紫芳庵</title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=Noto+Serif+JP:wght@300;400;500;700&display=swap" rel="stylesheet">

    <!-- CSS -->
    <link rel="stylesheet" href="/news.css">
</head>
<body>
    <!-- ヘッダーナビゲーション -->
    <nav class="header-nav">
        <ul class="nav-list">
            <li><a href="/index.html#news">料亭の想い</a></li>
            <li><a href="/index.html#ingredients">素材へのこだわり</a></li>
            <li><a href="/index.html#membership">会員制の特別空間</a></li>
            <li><a href="/index.html#space">和の趣が息づく空間</a></li>
            <li><a href="/index.html#access">アクセス</a></li>
            <li><a href="/index.html#notice">お知らせ</a></li>
        </ul>
    </nav>

    <!-- ロゴヘッダー -->
    <header class="logo-header">
        <img src="/img/shihouan_logo_black.png" alt="紫芳庵" class="header-logo">
    </header>

    <!-- メインコンテンツ -->
    <main class="main-container">
        <article class="article-content">
            <!-- タイトル -->
            <h1 class="article-category">お知らせ</h1>

            <!-- 公開日 -->
            <p class="article-date" id="article-date">2025年11月01日</p>

            <!-- 記事タイトル -->
            <h2 class="article-title" id="article-title">お知らせタイトル</h2>

            <!-- 本文 -->
            <div class="article-body" id="article-body">
                <p>本文がここに表示されます。</p>
            </div>

            <!-- 画像エリア -->
            <div class="article-images" id="article-images">
                <!-- 画像が動的に挿入されます -->
            </div>
        </article>
    </main>

    <!-- フッター -->
    <footer class="footer">
        <div class="footer-content">
            <div class="footer-info">
                <p class="footer-hours">営業時間: 11:30 - 15:00 / 17:00 - 22:00</p>
                <p class="footer-phone">TEL: 000-000-0000</p>
                <p class="footer-address">〒000-0000 東京都○○区○○ 1-2-3</p>
            </div>
            <div class="footer-logo">
                <img src="/img/shihouan_logo.png" alt="紫芳庵">
            </div>
        </div>
        <p class="footer-copyright">&copy; 2025 紫芳庵 All Rights Reserved.</p>
    </footer>

    <!-- TOPに戻るボタン -->
    <a href="/index.html" class="back-to-top">TOPへ戻る</a>

    <!-- お知らせ詳細表示スクリプト -->
    <script src="/js/news-detail.js"></script>
</body>
</html>
```

---

## ステップ1.5: お知らせ詳細表示用JavaScriptの作成

### 指示
URLパラメータからスラッグを取得し、該当するお知らせを表示するスクリプトを作成してください。

### ファイルパス
`/Users/hinotakafumi/Desktop/shihohonn/js/news-detail.js`

### 実装内容

```javascript
// news-detail.js - お知らせ詳細ページ表示機能

/**
 * お知らせ詳細を表示する
 */
class NewsDetail {
  constructor() {
    this.dataUrl = '/news-data.json';
    this.slug = this.getSlugFromUrl();
  }

  /**
   * URLからスラッグを取得
   * /news/autumn-menu-2025.html → autumn-menu-2025
   */
  getSlugFromUrl() {
    const pathParts = window.location.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    return fileName.replace('.html', '');
  }

  /**
   * 初期化処理
   */
  async init() {
    try {
      const newsItem = await this.loadNewsItem();

      if (!newsItem) {
        this.display404();
        return;
      }

      // アクセス権限チェック
      if (!this.canAccess(newsItem)) {
        this.displayNotPublished();
        return;
      }

      this.displayNewsItem(newsItem);
    } catch (error) {
      console.error('お知らせの読み込みに失敗しました:', error);
      this.display404();
    }
  }

  /**
   * お知らせデータを読み込む
   */
  async loadNewsItem() {
    const response = await fetch(this.dataUrl);
    if (!response.ok) {
      throw new Error('データの読み込みに失敗しました');
    }
    const data = await response.json();
    const newsArray = data.news || [];

    return newsArray.find(news => news.slug === this.slug);
  }

  /**
   * アクセス可否をチェック
   */
  canAccess(newsItem) {
    // 公開中はアクセス可能
    if (newsItem.status === 'published') {
      return true;
    }

    // 予約投稿で公開日時を過ぎている場合
    if (newsItem.status === 'scheduled' && newsItem.scheduledDate) {
      const now = new Date();
      const scheduledDate = new Date(newsItem.scheduledDate);
      return scheduledDate <= now;
    }

    // 下書き・非公開はアクセス不可
    return false;
  }

  /**
   * お知らせを表示
   */
  displayNewsItem(newsItem) {
    // ページタイトル
    document.getElementById('page-title').textContent = `${newsItem.title} | 紫芳庵`;

    // 公開日
    const formattedDate = this.formatDateJapanese(newsItem.publishDate);
    document.getElementById('article-date').textContent = formattedDate;

    // タイトル
    document.getElementById('article-title').textContent = newsItem.title;

    // 本文(改行を<br>に変換)
    const bodyHtml = this.formatBody(newsItem.body);
    document.getElementById('article-body').innerHTML = bodyHtml;

    // 画像
    this.displayImages(newsItem.images);
  }

  /**
   * 本文をフォーマット(改行を<p>タグで囲む)
   */
  formatBody(body) {
    const paragraphs = body.split('\n\n');
    return paragraphs.map(para => {
      const escapedPara = this.escapeHtml(para.trim());
      const withBreaks = escapedPara.replace(/\n/g, '<br>');
      return `<p>${withBreaks}</p>`;
    }).join('');
  }

  /**
   * 画像を表示
   */
  displayImages(images) {
    const imagesContainer = document.getElementById('article-images');

    if (!images || images.length === 0) {
      imagesContainer.style.display = 'none';
      return;
    }

    imagesContainer.innerHTML = images.map(imagePath => {
      return `<img src="/${imagePath}" alt="お知らせ画像" class="article-image">`;
    }).join('');
  }

  /**
   * 日付を日本語形式にフォーマット
   * 2025-11-01 → 2025年11月01日
   */
  formatDateJapanese(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${year}年${month}月${day}日`;
  }

  /**
   * 404エラー表示
   */
  display404() {
    document.getElementById('article-title').textContent = 'お知らせが見つかりません';
    document.getElementById('article-date').textContent = '';
    document.getElementById('article-body').innerHTML = '<p>お探しのお知らせは存在しないか、削除された可能性があります。</p>';
    document.getElementById('article-images').style.display = 'none';
  }

  /**
   * 非公開メッセージ表示
   */
  displayNotPublished() {
    document.getElementById('article-title').textContent = 'このお知らせは公開されていません';
    document.getElementById('article-date').textContent = '';
    document.getElementById('article-body').innerHTML = '<p>このお知らせは現在非公開です。</p>';
    document.getElementById('article-images').style.display = 'none';
  }

  /**
   * HTMLエスケープ(XSS対策)
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', () => {
  const newsDetail = new NewsDetail();
  newsDetail.init();
});
```

---

## ステップ1.6: jsディレクトリの作成

### 指示
`js` ディレクトリが存在しない場合は作成してください。

```bash
mkdir -p /Users/hinotakafumi/Desktop/shihohonn/js
```

---

## Phase 1 完了チェックリスト

- [ ] `news-data.json` が作成されている
- [ ] `js/news-display.js` が作成されている
- [ ] `js/news-detail.js` が作成されている
- [ ] `news-detail-template.html` が作成されている
- [ ] `index.html` にスクリプトが追加されている
- [ ] ブラウザでTOPページを開き、お知らせが表示されることを確認
- [ ] `/news/autumn-menu-2025.html` にアクセスして詳細が表示されることを確認

---

# Phase 2: 管理画面の基本機能

## ステップ2.1: adminディレクトリの作成

### 指示
管理画面用のディレクトリを作成してください。

```bash
mkdir -p /Users/hinotakafumi/Desktop/shihohonn/admin
```

---

## ステップ2.2: ログイン画面の作成

### ファイルパス
`/Users/hinotakafumi/Desktop/shihohonn/admin/login.html`

### 実装内容

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>管理者ログイン | 紫芳庵</title>
    <link rel="stylesheet" href="admin.css">
</head>
<body class="login-page">
    <div class="login-container">
        <div class="login-box">
            <h1 class="login-title">紫芳庵 管理画面</h1>
            <p class="login-subtitle">お知らせ管理システム</p>

            <form id="login-form" class="login-form">
                <div class="form-group">
                    <label for="password">パスワード</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="パスワードを入力"
                        required
                        autocomplete="current-password"
                    >
                </div>

                <div id="error-message" class="error-message" style="display: none;"></div>

                <button type="submit" class="btn-primary">ログイン</button>
            </form>
        </div>
    </div>

    <script src="../js/admin-auth.js"></script>
</body>
</html>
```

---

## ステップ2.3: 認証管理JavaScriptの作成

### ファイルパス
`/Users/hinotakafumi/Desktop/shihohonn/js/admin-auth.js`

### 実装内容

```javascript
// admin-auth.js - 管理者認証機能

/**
 * 管理者認証クラス
 */
class AdminAuth {
  constructor() {
    this.dataUrl = '/news-data.json';
    this.sessionKey = 'shihouan_admin_session';
    this.sessionDuration = 24 * 60 * 60 * 1000; // 24時間
  }

  /**
   * パスワードをSHA-256でハッシュ化
   */
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * ログイン処理
   */
  async login(password) {
    try {
      const hashedPassword = await this.hashPassword(password);

      // news-data.jsonから正しいハッシュを取得
      const response = await fetch(this.dataUrl);
      const data = await response.json();
      const correctHash = data.settings.adminPasswordHash;

      if (hashedPassword === correctHash) {
        // セッション作成
        this.createSession();
        return { success: true };
      } else {
        return { success: false, error: 'パスワードが正しくありません' };
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      return { success: false, error: 'ログインに失敗しました' };
    }
  }

  /**
   * セッション作成
   */
  createSession() {
    const session = {
      token: this.generateToken(),
      expiresAt: Date.now() + this.sessionDuration
    };
    localStorage.setItem(this.sessionKey, JSON.stringify(session));
  }

  /**
   * セッションチェック
   */
  isAuthenticated() {
    const sessionData = localStorage.getItem(this.sessionKey);
    if (!sessionData) return false;

    try {
      const session = JSON.parse(sessionData);

      // 有効期限チェック
      if (Date.now() > session.expiresAt) {
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * ログアウト
   */
  logout() {
    localStorage.removeItem(this.sessionKey);
  }

  /**
   * ランダムトークン生成
   */
  generateToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * 未認証時にログインページにリダイレクト
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = '/admin/login.html';
    }
  }
}

// ログインフォーム処理(login.htmlで使用)
if (document.getElementById('login-form')) {
  const auth = new AdminAuth();

  // すでにログイン済みの場合はダッシュボードにリダイレクト
  if (auth.isAuthenticated()) {
    window.location.href = '/admin/dashboard.html';
  }

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    const result = await auth.login(password);

    if (result.success) {
      window.location.href = '/admin/dashboard.html';
    } else {
      errorMessage.textContent = result.error;
      errorMessage.style.display = 'block';
    }
  });
}
```

---

## ステップ2.4: 管理画面ダッシュボードの作成

### ファイルパス
`/Users/hinotakafumi/Desktop/shihohonn/admin/dashboard.html`

### 実装内容

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>お知らせ管理 | 紫芳庵</title>
    <link rel="stylesheet" href="admin.css">
</head>
<body class="dashboard-page">
    <header class="admin-header">
        <h1 class="admin-title">紫芳庵 お知らせ管理</h1>
        <div class="admin-actions">
            <button id="btn-logout" class="btn-secondary">ログアウト</button>
        </div>
    </header>

    <main class="admin-main">
        <div class="dashboard-controls">
            <button id="btn-create-news" class="btn-primary">新規作成</button>
        </div>

        <div class="news-table-container">
            <table class="news-table" id="news-table">
                <thead>
                    <tr>
                        <th>タイトル</th>
                        <th>公開日</th>
                        <th>ステータス</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="news-table-body">
                    <!-- JavaScriptで動的に生成 -->
                </tbody>
            </table>
        </div>
    </main>

    <!-- 作成・編集モーダル -->
    <div id="edit-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="modal-title">お知らせ作成</h2>
                <button class="btn-close" id="btn-close-modal">&times;</button>
            </div>

            <form id="news-form" class="news-form">
                <input type="hidden" id="news-id" name="id">

                <div class="form-group">
                    <label for="news-title">タイトル <span class="required">*</span></label>
                    <input
                        type="text"
                        id="news-title"
                        name="title"
                        maxlength="100"
                        placeholder="お知らせのタイトルを入力"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="news-slug">スラッグ(URL用) <span class="required">*</span></label>
                    <input
                        type="text"
                        id="news-slug"
                        name="slug"
                        pattern="[a-z0-9\-]+"
                        placeholder="例: autumn-menu-2025"
                        required
                    >
                    <small>半角英数字とハイフンのみ使用可能</small>
                </div>

                <div class="form-group">
                    <label for="news-publish-date">公開日 <span class="required">*</span></label>
                    <input
                        type="date"
                        id="news-publish-date"
                        name="publishDate"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="news-body">本文 <span class="required">*</span></label>
                    <textarea
                        id="news-body"
                        name="body"
                        rows="10"
                        maxlength="5000"
                        placeholder="お知らせの本文を入力&#10;&#10;空行で段落を分けることができます"
                        required
                    ></textarea>
                </div>

                <div class="form-group">
                    <label>公開設定 <span class="required">*</span></label>
                    <div class="radio-group">
                        <label>
                            <input type="radio" name="status" value="published" checked>
                            即時公開
                        </label>
                        <label>
                            <input type="radio" name="status" value="scheduled">
                            予約投稿
                        </label>
                        <label>
                            <input type="radio" name="status" value="draft">
                            下書き保存
                        </label>
                        <label>
                            <input type="radio" name="status" value="unpublished">
                            非公開
                        </label>
                    </div>
                </div>

                <div class="form-group" id="scheduled-datetime-group" style="display: none;">
                    <label for="scheduled-datetime">予約投稿日時 <span class="required">*</span></label>
                    <input
                        type="datetime-local"
                        id="scheduled-datetime"
                        name="scheduledDate"
                    >
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-secondary" id="btn-cancel">キャンセル</button>
                    <button type="submit" class="btn-primary">保存</button>
                </div>
            </form>
        </div>
    </div>

    <script src="../js/admin-auth.js"></script>
    <script src="../js/admin-dashboard.js"></script>
</body>
</html>
```

---

## ステップ2.5: ダッシュボード機能JavaScriptの作成

### ファイルパス
`/Users/hinotakafumi/Desktop/shihohonn/js/admin-dashboard.js`

### 実装内容

```javascript
// admin-dashboard.js - 管理画面ダッシュボード機能

/**
 * 管理画面ダッシュボード
 */
class AdminDashboard {
  constructor() {
    this.auth = new AdminAuth();
    this.dataUrl = '/news-data.json';
    this.newsData = null;
    this.editingId = null;

    // 認証チェック
    this.auth.requireAuth();

    this.init();
  }

  /**
   * 初期化
   */
  async init() {
    await this.loadNewsData();
    this.renderNewsTable();
    this.bindEvents();
  }

  /**
   * お知らせデータを読み込む
   */
  async loadNewsData() {
    try {
      const response = await fetch(this.dataUrl);
      this.newsData = await response.json();
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
      alert('データの読み込みに失敗しました');
    }
  }

  /**
   * お知らせ一覧テーブルを描画
   */
  renderNewsTable() {
    const tbody = document.getElementById('news-table-body');
    const newsList = this.newsData.news || [];

    if (newsList.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">お知らせがありません</td></tr>';
      return;
    }

    tbody.innerHTML = newsList.map(news => {
      const statusBadge = this.getStatusBadge(news);
      const publishDate = news.publishDate || '-';

      return `
        <tr>
          <td>${this.escapeHtml(news.title)}</td>
          <td>${publishDate}</td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn-edit" data-id="${news.id}">編集</button>
            <button class="btn-delete" data-id="${news.id}">削除</button>
          </td>
        </tr>
      `;
    }).join('');

    // 編集・削除ボタンのイベント
    tbody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => this.openEditModal(btn.dataset.id));
    });

    tbody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => this.deleteNews(btn.dataset.id));
    });
  }

  /**
   * ステータスバッジを取得
   */
  getStatusBadge(news) {
    const statusMap = {
      'published': '<span class="badge badge-published">公開中</span>',
      'scheduled': `<span class="badge badge-scheduled">予約投稿 (${news.scheduledDate})</span>`,
      'draft': '<span class="badge badge-draft">下書き</span>',
      'unpublished': '<span class="badge badge-unpublished">非公開</span>'
    };
    return statusMap[news.status] || '';
  }

  /**
   * イベントバインド
   */
  bindEvents() {
    // ログアウト
    document.getElementById('btn-logout').addEventListener('click', () => {
      this.auth.logout();
      window.location.href = '/admin/login.html';
    });

    // 新規作成
    document.getElementById('btn-create-news').addEventListener('click', () => {
      this.openCreateModal();
    });

    // モーダル閉じる
    document.getElementById('btn-close-modal').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('btn-cancel').addEventListener('click', () => {
      this.closeModal();
    });

    // フォーム送信
    document.getElementById('news-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveNews();
    });

    // 公開設定変更時
    document.querySelectorAll('input[name="status"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const scheduledGroup = document.getElementById('scheduled-datetime-group');
        scheduledGroup.style.display = radio.value === 'scheduled' ? 'block' : 'none';
      });
    });
  }

  /**
   * 新規作成モーダルを開く
   */
  openCreateModal() {
    this.editingId = null;
    document.getElementById('modal-title').textContent = 'お知らせ作成';
    document.getElementById('news-form').reset();

    // デフォルト日付を今日に設定
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('news-publish-date').value = today;

    document.getElementById('edit-modal').style.display = 'flex';
  }

  /**
   * 編集モーダルを開く
   */
  openEditModal(id) {
    this.editingId = id;
    const news = this.newsData.news.find(n => n.id === id);

    if (!news) return;

    document.getElementById('modal-title').textContent = 'お知らせ編集';
    document.getElementById('news-id').value = news.id;
    document.getElementById('news-title').value = news.title;
    document.getElementById('news-slug').value = news.slug;
    document.getElementById('news-publish-date').value = news.publishDate || '';
    document.getElementById('news-body').value = news.body;

    // ステータス選択
    document.querySelector(`input[name="status"][value="${news.status}"]`).checked = true;

    // 予約投稿日時
    if (news.status === 'scheduled' && news.scheduledDate) {
      document.getElementById('scheduled-datetime').value =
        news.scheduledDate.slice(0, 16); // ISO形式からdatetime-local形式に
      document.getElementById('scheduled-datetime-group').style.display = 'block';
    }

    document.getElementById('edit-modal').style.display = 'flex';
  }

  /**
   * モーダルを閉じる
   */
  closeModal() {
    document.getElementById('edit-modal').style.display = 'none';
  }

  /**
   * お知らせを保存
   */
  async saveNews() {
    const formData = new FormData(document.getElementById('news-form'));
    const newsItem = {
      id: this.editingId || `news-${String(this.newsData.settings.nextId).padStart(3, '0')}`,
      title: formData.get('title'),
      slug: formData.get('slug'),
      publishDate: formData.get('publishDate'),
      publishTime: '09:00', // デフォルト時刻
      body: formData.get('body'),
      images: [], // Phase 3で実装
      status: formData.get('status'),
      scheduledDate: formData.get('status') === 'scheduled' ?
        new Date(formData.get('scheduledDate')).toISOString() : null,
      createdAt: this.editingId ?
        this.newsData.news.find(n => n.id === this.editingId).createdAt :
        new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // バリデーション
    if (!this.validateNews(newsItem)) {
      return;
    }

    // 新規 or 更新
    if (this.editingId) {
      const index = this.newsData.news.findIndex(n => n.id === this.editingId);
      this.newsData.news[index] = newsItem;
    } else {
      this.newsData.news.unshift(newsItem);
      this.newsData.settings.nextId++;
    }

    // 保存(実際にはサーバーにPOSTする必要あり)
    await this.saveToServer();

    this.closeModal();
    this.renderNewsTable();
  }

  /**
   * バリデーション
   */
  validateNews(newsItem) {
    // スラッグ重複チェック
    const duplicateSlug = this.newsData.news.find(n =>
      n.slug === newsItem.slug && n.id !== newsItem.id
    );

    if (duplicateSlug) {
      alert('このスラッグは既に使用されています');
      return false;
    }

    // スラッグ形式チェック
    if (!/^[a-z0-9\-]+$/.test(newsItem.slug)) {
      alert('スラッグは半角英数字とハイフンのみ使用できます');
      return false;
    }

    return true;
  }

  /**
   * サーバーに保存(実際にはPHPやNode.jsのAPIが必要)
   */
  async saveToServer() {
    // ここではローカルストレージに一時保存
    // 実際の実装ではサーバーにPOSTする
    localStorage.setItem('shihouan_news_data', JSON.stringify(this.newsData));
    alert('保存しました');
  }

  /**
   * お知らせを削除
   */
  async deleteNews(id) {
    if (!confirm('本当に削除しますか?')) {
      return;
    }

    this.newsData.news = this.newsData.news.filter(n => n.id !== id);
    await this.saveToServer();
    this.renderNewsTable();
  }

  /**
   * HTMLエスケープ
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// 初期化
if (document.querySelector('.dashboard-page')) {
  new AdminDashboard();
}
```

---

## ステップ2.6: 管理画面CSSの作成

### ファイルパス
`/Users/hinotakafumi/Desktop/shihohonn/admin/admin.css`

### 実装内容

```css
/* admin.css - 管理画面スタイル */

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: #f5f5f5;
  color: #333;
  line-height: 1.6;
}

/* ログインページ */
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #160E0B 0%, #3a2a1f 100%);
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 20px;
}

.login-box {
  background: white;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 10px;
  color: #160E0B;
}

.login-subtitle {
  font-size: 14px;
  text-align: center;
  color: #666;
  margin-bottom: 30px;
}

.login-form .form-group {
  margin-bottom: 20px;
}

.login-form label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.login-form input[type="password"] {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.login-form input[type="password"]:focus {
  outline: none;
  border-color: #C9BC9C;
}

.error-message {
  background-color: #fee;
  color: #c33;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 14px;
}

/* ダッシュボード */
.dashboard-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.admin-header {
  background: #160E0B;
  color: white;
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.admin-title {
  font-size: 20px;
  font-weight: 600;
}

.admin-main {
  flex: 1;
  padding: 40px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.dashboard-controls {
  margin-bottom: 20px;
}

/* テーブル */
.news-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.news-table {
  width: 100%;
  border-collapse: collapse;
}

.news-table th,
.news-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.news-table th {
  background-color: #f8f8f8;
  font-weight: 600;
  color: #333;
}

.news-table tbody tr:hover {
  background-color: #fafafa;
}

/* ステータスバッジ */
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-published {
  background-color: #d4edda;
  color: #155724;
}

.badge-scheduled {
  background-color: #fff3cd;
  color: #856404;
}

.badge-draft {
  background-color: #d1ecf1;
  color: #0c5460;
}

.badge-unpublished {
  background-color: #e2e3e5;
  color: #383d41;
}

/* ボタン */
.btn-primary,
.btn-secondary,
.btn-edit,
.btn-delete {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background-color: #C9BC9C;
  color: white;
}

.btn-primary:hover {
  background-color: #b3a684;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-edit {
  background-color: #007bff;
  color: white;
  margin-right: 8px;
}

.btn-edit:hover {
  background-color: #0056b3;
}

.btn-delete {
  background-color: #dc3545;
  color: white;
}

.btn-delete:hover {
  background-color: #c82333;
}

/* モーダル */
.modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #999;
  line-height: 1;
}

.btn-close:hover {
  color: #333;
}

/* フォーム */
.news-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.required {
  color: #dc3545;
}

.form-group input[type="text"],
.form-group input[type="date"],
.form-group input[type="datetime-local"],
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
}

.form-group small {
  display: block;
  margin-top: 4px;
  color: #666;
  font-size: 12px;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: normal;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
```

---

## Phase 2 完了チェックリスト

- [ ] `admin` ディレクトリが作成されている
- [ ] `admin/login.html` が作成されている
- [ ] `admin/dashboard.html` が作成されている
- [ ] `admin/admin.css` が作成されている
- [ ] `js/admin-auth.js` が作成されている
- [ ] `js/admin-dashboard.js` が作成されている
- [ ] `/admin/login.html` にアクセスしてログインできる(パスワード: `shihouan2025`)
- [ ] ダッシュボードでお知らせ一覧が表示される
- [ ] お知らせの新規作成・編集ができる
- [ ] お知らせの削除ができる

---

# Phase 3: 高度な機能(画像アップロード等)

## 注意事項

Phase 3の画像アップロード機能は、**サーバーサイドプログラム(PHP、Node.js等)が必要**です。

現在の実装ではフロントエンドのみで完結していますが、画像アップロードを実装するには以下が必要です:

1. **サーバーサイドAPI**: 画像をアップロードするエンドポイント
2. **ファイル保存処理**: サーバー上の `/img/news/` ディレクトリに保存
3. **JSONファイル更新**: サーバー上で `news-data.json` を書き換え

### 実装方法の選択肢

#### オプションA: PHP実装(推奨 - レンタルサーバー向け)
- `api/upload-image.php` - 画像アップロードAPI
- `api/save-news.php` - お知らせ保存API
- `api/delete-news.php` - お知らせ削除API

#### オプションB: Node.js + Express実装
- `server.js` - ExpressサーバーとAPI
- multerライブラリで画像アップロード処理

### Phase 3実装が必要な場合

Claude に以下のように指示してください:

```
「Phase 3の画像アップロード機能を実装してください。
サーバーサイドはPHP(またはNode.js)で実装してください。」
```

---

## 補足: サーバーへのデータ保存について

現在の実装では `localStorage` に一時保存していますが、実際の運用では以下のいずれかが必要です:

### 方法1: サーバーサイドAPI経由で保存(推奨)
- `api/save-news.php` を作成
- JavaScriptから `fetch()` でPOSTリクエスト
- サーバー側で `news-data.json` を書き換え

### 方法2: Headless CMS利用
- microCMS、Contentful等のサービス利用
- API経由でデータを保存・取得
- 管理画面も提供される(カスタム管理画面は不要)

---

## 最終テスト手順

### フロントエンド表示テスト
1. ブラウザで `/index.html` を開く
2. お知らせバッジに最新1件が表示されることを確認
3. お知らせ一覧セクションに最新5件が表示されることを確認
4. お知らせをクリックして詳細ページに遷移することを確認

### 管理画面テスト
1. `/admin/login.html` にアクセス
2. パスワード `shihouan2025` でログイン
3. ダッシュボードでお知らせ一覧が表示されることを確認
4. 新規作成でお知らせを作成
5. 作成したお知らせが一覧に表示されることを確認
6. 作成したお知らせをフロントエンドで表示確認
7. 編集機能のテスト
8. 削除機能のテスト(確認ダイアログ含む)
9. 各ステータス(公開/予約/下書き/非公開)のテスト

### セキュリティテスト
1. 未ログイン状態で `/admin/dashboard.html` に直接アクセス → ログイン画面にリダイレクトされることを確認
2. ログアウト後に再度アクセス → ログイン画面に戻ることを確認
3. HTMLタグを含むタイトルを入力 → エスケープされて表示されることを確認

---

## トラブルシューティング

### お知らせが表示されない場合
- ブラウザの開発者ツールでコンソールエラーを確認
- `news-data.json` のパスが正しいか確認
- JSONの構文エラーがないか確認

### ログインできない場合
- パスワードが `shihouan2025` であることを確認
- `news-data.json` の `adminPasswordHash` が正しいか確認
- ブラウザのLocalStorageをクリアして再試行

### 管理画面で保存できない場合
- ブラウザのLocalStorageに保存されているか確認
- 実運用にはサーバーサイドAPIが必要であることを理解

---

## まとめ

この指示書に従って実装することで、以下の機能が完成します:

### ✅ 完成する機能
- TOPページにお知らせ表示(最新1件バッジ、最新5件一覧)
- お知らせ詳細ページの動的生成
- 管理者ログイン機能
- お知らせの作成・編集・削除
- 公開/非公開/予約投稿/下書き機能
- セキュリティ対策(認証、XSS防止)

### ⚠️ サーバーサイド実装が必要な機能
- 画像アップロード
- JSONファイルへの永続的な保存
- 複数管理者対応

---

**実装担当**: Claude Code
**設計書参照**: [DESIGN_DOCUMENT.md](DESIGN_DOCUMENT.md)
**最終更新**: 2025年11月19日
