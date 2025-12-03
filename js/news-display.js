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
      this.displaySpBanner();
      this.displayNewsList();
    } catch (error) {
      console.error('お知らせの読み込みに失敗しました:', error);
    }
  }

  /**
   * JSONデータを読み込む
   */
  async loadNewsData() {
    // キャッシュを回避するためタイムスタンプを付与
    const response = await fetch(this.dataUrl + '?t=' + Date.now());
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
   * SP版バナーに最新1件を表示
   */
  displaySpBanner() {
    const bannerInner = document.querySelector('.news-banner-inner');
    if (!bannerInner) return;

    const publishedNews = this.getPublishedNews();
    if (publishedNews.length === 0) {
      const bannerSection = document.querySelector('.news-banner-section');
      if (bannerSection) {
        bannerSection.style.display = 'none';
      }
      return;
    }

    const latest = publishedNews[0];
    const formattedDate = this.formatDate(latest.publishDate);

    bannerInner.innerHTML = `
      <span class="news-banner-label">NEW</span>
      <span class="news-banner-date">${formattedDate}</span>
      <span class="news-banner-text">${this.escapeHtml(latest.title)}</span>
    `;

    // クリックで詳細ページに遷移
    bannerInner.style.cursor = 'pointer';
    bannerInner.onclick = () => {
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
