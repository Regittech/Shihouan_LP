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

    // 本文(改行を<p>タグで囲む)
    const bodyHtml = this.formatBody(newsItem.body);
    document.getElementById('article-body').innerHTML = bodyHtml;

    // 画像
    this.displayImages(newsItem.images);

    // レイアウトを調整（コンテンツの高さに応じて要素を配置）
    this.adjustLayout();
  }

  /**
   * 本文をフォーマット
   * HTMLコンテンツの場合はそのまま表示、プレーンテキストの場合は改行を処理
   */
  formatBody(body) {
    if (!body) return '';

    // HTMLタグが含まれているかチェック
    const hasHtmlTags = /<[^>]+>/.test(body);

    if (hasHtmlTags) {
      // HTMLコンテンツの場合はそのまま返す（XSS対策済みのQuill出力を信頼）
      return `<div class="article-rich-content">${body}</div>`;
    } else {
      // プレーンテキストの場合は従来通り改行を処理
      const paragraphs = body.split('\n\n');
      return paragraphs.map(para => {
        const escapedPara = this.escapeHtml(para.trim());
        const withBreaks = escapedPara.replace(/\n/g, '<br>');
        return `<div class="article-body">${withBreaks}</div>`;
      }).join('');
    }
  }

  /**
   * 画像を表示
   */
  displayImages(images) {
    const imagesContainer = document.getElementById('article-images-container');

    if (!images || images.length === 0) {
      imagesContainer.style.display = 'none';
      return;
    }

    // 最初の画像は大きく表示
    if (images.length >= 1) {
      const largeImageDiv = document.createElement('div');
      largeImageDiv.className = 'image-large';
      const largeImg = document.createElement('img');
      largeImg.src = `/${images[0]}`;
      largeImg.alt = 'お知らせ画像';
      largeImg.style.width = '100%';
      largeImg.style.height = 'auto';
      largeImageDiv.appendChild(largeImg);
      imagesContainer.appendChild(largeImageDiv);
    }

    // 2枚目以降の画像はグリッド表示
    if (images.length >= 2) {
      const gridDiv = document.createElement('div');
      gridDiv.className = 'image-grid';

      for (let i = 1; i < images.length && i < 3; i++) {
        const smallImageDiv = document.createElement('div');
        smallImageDiv.className = 'image-small';
        const smallImg = document.createElement('img');
        smallImg.src = `/${images[i]}`;
        smallImg.alt = 'お知らせ画像';
        smallImg.style.width = '100%';
        smallImg.style.height = 'auto';
        smallImageDiv.appendChild(smallImg);
        gridDiv.appendChild(smallImageDiv);
      }

      imagesContainer.appendChild(gridDiv);
    }
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
   * レイアウト調整（コンテンツの高さに応じて動的に配置）
   */
  adjustLayout() {
    // すべての画像の読み込みを待ってから実行
    const images = document.querySelectorAll('.content-container img, #article-images-container img');
    const imageLoadPromises = Array.from(images).map(img => {
      if (img.complete) {
        return Promise.resolve();
      }
      return new Promise(resolve => {
        img.addEventListener('load', resolve);
        img.addEventListener('error', resolve); // エラーの場合も続行
      });
    });

    Promise.all(imageLoadPromises).then(() => {
      // さらに少し待機してDOMの更新を確実にする
      setTimeout(() => {
      const contentContainer = document.querySelector('.content-container');
      const backToTop = document.querySelector('.back-to-top');
      const backToTopLine = document.querySelector('.back-to-top-line');
      const footerSection = document.querySelector('footer'); // フッター
      const back1 = document.querySelector('.back-1');
      const back4 = document.querySelector('.back-4');

      if (!contentContainer || !backToTop || !backToTopLine || !footerSection) return;

      // コンテンツコンテナの高さと位置を取得（実際のDOM位置を動的に取得）
      const containerTop = contentContainer.offsetTop; // 実際の位置を取得（CSSの変更に自動追従）
      const containerHeight = contentContainer.offsetHeight;

      // SP版かどうかを判定（768px以下）
      const isSP = window.innerWidth <= 768;

      // ビューポート幅に応じて余白を動的に調整
      let bottomMargin;
      if (isSP) {
        // SP版: 60px
        bottomMargin = 60;
      } else {
        // PC版: ビューポート幅に応じて40px〜100pxの間で調整
        // 555px → 40px, 1440px以上 → 100px
        const viewportWidth = window.innerWidth;
        if (viewportWidth <= 555) {
          bottomMargin = 40;
        } else if (viewportWidth >= 1440) {
          bottomMargin = 100;
        } else {
          // 555px〜1440pxの間は線形補間
          // 40px + (100px - 40px) * (現在の幅 - 555px) / (1440px - 555px)
          bottomMargin = 40 + (60 * (viewportWidth - 555) / (1440 - 555));
        }
      }

      // 「TOPへ戻る」の位置を計算（コンテンツの下 + 余白）
      const backToTopPosition = containerTop + containerHeight + bottomMargin;
      backToTop.style.top = `${backToTopPosition}px`;

      // アンダーラインの位置を計算
      const backToTopTextElement = document.querySelector('.back-to-top-text');
      if (backToTopTextElement) {
        const textHeight = backToTopTextElement.offsetHeight;
        // テキストの垂直中央に線を配置
        const backToTopLineTop = backToTopPosition + (textHeight / 2);
        backToTopLine.style.top = `${backToTopLineTop}px`;
      }

      // フッターの位置は自然な流れに任せる（position: relativeなので）
      // 背景レイヤーback-4の調整のみ行う

      // 背景レイヤーの調整
      // back-5: 0-1014px (固定)
      // back-1: 1014px から始まり、フッターの手前まで伸ばす
      // back-4: フッターの背景として配置

      // TOPへ戻るボタンの高さを取得
      const backToTopHeight = backToTop.offsetHeight || 32;

      // TOPへ戻るボタンからフッターまでの余白を動的に調整
      let footerMargin;
      if (isSP) {
        // SP版: 50px (元の値に戻す)
        footerMargin = 50;
      } else {
        // PC版: ビューポート幅に応じて45px〜65pxの間で調整 (全体的に15px増加)
        const viewportWidth = window.innerWidth;
        if (viewportWidth <= 555) {
          footerMargin = 45;
        } else if (viewportWidth >= 1440) {
          footerMargin = 65;
        } else {
          // 555px〜1440pxの間は線形補間
          footerMargin = 45 + (20 * (viewportWidth - 555) / (1440 - 555));
        }
      }

      const footerTop = backToTopPosition + backToTopHeight + footerMargin;

      // back-5とback-1の高さを調整
      const back5 = document.querySelector('.back-5');

      if (isSP) {
        // SP版: footerTopが1014px未満の場合、back-5の高さをfooterTopに制限
        if (back5) {
          const back5Height = Math.min(footerTop, 1014);
          back5.style.height = `${back5Height}px`;
        }

        if (back1) {
          if (footerTop > 1014) {
            // 画面幅に応じてback-1の最大高さを動的に調整
            let maxBack1Height;

            if (viewportWidth <= 400) {
              // 極小スマホ（iPhone SE, 小型Android）: 最大450px
              maxBack1Height = 450;
            } else if (viewportWidth <= 600) {
              // 通常スマホ（iPhone 14, Android 412px等）: 最大650px
              maxBack1Height = 650;
            } else {
              // 大型スマホ・ファブレット: 最大800px
              maxBack1Height = 800;
            }

            const calculatedHeight = footerTop - 1014;
            const back1Height = Math.min(calculatedHeight, maxBack1Height);

            // デバッグログ
            console.log(`[SP版 back-1] viewport: ${viewportWidth}px, maxHeight: ${maxBack1Height}px, calculated: ${calculatedHeight}px, actual: ${back1Height}px`);

            back1.style.height = `${back1Height}px`;
            back1.style.display = 'block';
          } else {
            back1.style.display = 'none';
            console.log(`[SP版 back-1] footerTop (${footerTop}px) <= 1014px なので非表示`);
          }
        }
      } else {
        // PC版: 元の動作を維持（変更なし）
        if (back5) {
          back5.style.height = '1014px';
        }

        if (back1) {
          const back1Height = footerTop - 1014;
          if (back1Height > 0) {
            back1.style.height = `${back1Height}px`;
            back1.style.display = 'block';
          } else {
            back1.style.display = 'none';
          }
        }
      }

      if (back4) {
        // フッターの39px上から背景を開始（footer::beforeの-39pxと統合）
        back4.style.top = `${footerTop - 39}px`;
        // 新しいフッターの実際の高さを取得 + 39px
        const footerHeight = footerSection.offsetHeight || 600;
        back4.style.height = `${footerHeight + 39}px`;
        back4.style.display = 'block';
      }

      // main-contentの高さを調整
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        if (isSP) {
          // SP版: back-5 + back-1の実際の合計高さに合わせる（画面幅に応じて制限）
          const actualBack5Height = Math.min(footerTop, 1014);
          const calculatedBack1Height = footerTop > 1014 ? (footerTop - 1014) : 0;

          // 画面幅に応じてback-1の最大高さを動的に調整（viewportWidthは既に定義済み）
          let maxBack1Height;

          if (viewportWidth <= 400) {
            maxBack1Height = 450;
          } else if (viewportWidth <= 600) {
            maxBack1Height = 650;
          } else {
            maxBack1Height = 800;
          }

          const actualBack1Height = Math.min(calculatedBack1Height, maxBack1Height);
          mainContent.style.height = `${actualBack5Height + actualBack1Height}px`;
        } else {
          // PC版: 元の動作を維持（変更なし）
          // footerTopまでの高さに設定（back-5: 1014px + back-1: (footerTop - 1014px) = footerTop）
          mainContent.style.height = `${footerTop}px`;
        }
      }
      }, 100);
    });
  }

  /**
   * 404エラー表示
   */
  display404() {
    document.getElementById('article-title').textContent = 'お知らせが見つかりません';
    document.getElementById('article-date').textContent = '';
    document.getElementById('article-body').innerHTML = '<p>お探しのお知らせは存在しないか、削除された可能性があります。</p>';
    document.getElementById('article-images-container').style.display = 'none';
  }

  /**
   * 非公開メッセージ表示
   */
  displayNotPublished() {
    document.getElementById('article-title').textContent = 'このお知らせは公開されていません';
    document.getElementById('article-date').textContent = '';
    document.getElementById('article-body').innerHTML = '<p>このお知らせは現在非公開です。</p>';
    document.getElementById('article-images-container').style.display = 'none';
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
