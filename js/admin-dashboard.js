// admin-dashboard.js - 管理画面ダッシュボード機能

/**
 * 管理画面ダッシュボード
 */
class AdminDashboard {
  constructor() {
    this.auth = new AdminAuth();
    this.dataUrl = '/news-data.json';
    this.saveApiUrl = '/api/save-news.php';
    this.uploadApiUrl = '/api/upload-image.php';
    this.newsData = null;
    this.editingId = null;
    this.uploadedImages = []; // アップロード済み画像パス
    this.quillEditor = null; // Quillエディターインスタンス

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
    this.initQuillEditor();
    this.bindEvents();
  }

  /**
   * Quillエディターを初期化
   */
  initQuillEditor() {
    const toolbarOptions = [
      [{ 'header': [2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ];

    this.quillEditor = new Quill('#news-body-editor', {
      theme: 'snow',
      modules: {
        toolbar: {
          container: toolbarOptions,
          handlers: {
            'image': this.handleQuillImageInsert.bind(this)
          }
        }
      },
      placeholder: 'お知らせの本文を入力してください...'
    });

    // 文字数制限（5000文字）
    this.quillEditor.on('text-change', () => {
      const text = this.quillEditor.getText();
      if (text.length > 5000) {
        this.quillEditor.deleteText(5000, text.length);
      }
    });
  }

  /**
   * Quillエディターの画像挿入ハンドラ
   */
  handleQuillImageInsert() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/png,image/jpeg,image/jpg');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      // ファイルサイズチェック(5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('画像のサイズが5MBを超えています');
        return;
      }

      try {
        // 画像をアップロード
        const uploadedPath = await this.uploadImage(file);

        // エディターに画像を挿入
        const range = this.quillEditor.getSelection(true);
        this.quillEditor.insertEmbed(range.index, 'image', `/${uploadedPath}`);
        this.quillEditor.setSelection(range.index + 1);
      } catch (error) {
        alert('画像のアップロードに失敗しました');
      }
    };
  }

  /**
   * お知らせデータを読み込む
   */
  async loadNewsData() {
    try {
      const response = await fetch(this.dataUrl + '?t=' + Date.now()); // キャッシュ回避
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

    // 日付降順でソート
    const sortedNews = [...newsList].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    });

    tbody.innerHTML = sortedNews.map(news => {
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
      'scheduled': `<span class="badge badge-scheduled">予約投稿 (${this.formatDateForDisplay(news.scheduledDate)})</span>`,
      'draft': '<span class="badge badge-draft">下書き</span>',
      'unpublished': '<span class="badge badge-unpublished">非公開</span>'
    };
    return statusMap[news.status] || '';
  }

  /**
   * 日時を表示用にフォーマット
   */
  formatDateForDisplay(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
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

    // 画像選択時
    document.getElementById('news-images').addEventListener('change', (e) => {
      this.handleImageSelect(e);
    });
  }

  /**
   * 画像選択ハンドラ
   */
  async handleImageSelect(event) {
    const files = Array.from(event.target.files);
    const previewContainer = document.getElementById('image-preview-container');

    // 最大5枚まで
    if (this.uploadedImages.length + files.length > 5) {
      alert('画像は最大5枚までアップロードできます');
      return;
    }

    for (const file of files) {
      // ファイルサイズチェック(5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} のサイズが5MBを超えています`);
        continue;
      }

      // プレビュー表示
      const reader = new FileReader();
      reader.onload = async (e) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'image-preview-item';

        const img = document.createElement('img');
        img.src = e.target.result;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'image-preview-remove';
        removeBtn.textContent = '×';
        removeBtn.type = 'button';

        previewItem.appendChild(img);
        previewItem.appendChild(removeBtn);
        previewContainer.appendChild(previewItem);

        // サーバーにアップロード
        try {
          const uploadedPath = await this.uploadImage(file);
          this.uploadedImages.push(uploadedPath);

          // 削除ボタンのイベント
          removeBtn.addEventListener('click', () => {
            const index = this.uploadedImages.indexOf(uploadedPath);
            if (index > -1) {
              this.uploadedImages.splice(index, 1);
            }
            previewItem.remove();
          });
        } catch (error) {
          alert('画像のアップロードに失敗しました');
          previewItem.remove();
        }
      };

      reader.readAsDataURL(file);
    }

    // ファイル入力をリセット
    event.target.value = '';
  }

  /**
   * 画像をサーバーにアップロード
   */
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(this.uploadApiUrl, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    return result.filePath;
  }

  /**
   * 新規作成モーダルを開く
   */
  openCreateModal() {
    this.editingId = null;
    this.uploadedImages = [];
    document.getElementById('modal-title').textContent = 'お知らせ作成';
    document.getElementById('news-form').reset();
    document.getElementById('image-preview-container').innerHTML = '';

    // Quillエディターをクリア
    this.quillEditor.setContents([]);

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

    this.uploadedImages = [...(news.images || [])];

    document.getElementById('modal-title').textContent = 'お知らせ編集';
    document.getElementById('news-id').value = news.id;
    document.getElementById('news-title').value = news.title;
    document.getElementById('news-slug').value = news.slug;
    document.getElementById('news-publish-date').value = news.publishDate || '';

    // Quillエディターに既存の本文を設定
    this.setQuillContent(news.body);

    // ステータス選択
    document.querySelector(`input[name="status"][value="${news.status}"]`).checked = true;

    // 予約投稿日時
    if (news.status === 'scheduled' && news.scheduledDate) {
      document.getElementById('scheduled-datetime').value =
        news.scheduledDate.slice(0, 16); // ISO形式からdatetime-local形式に
      document.getElementById('scheduled-datetime-group').style.display = 'block';
    }

    // 既存画像のプレビュー表示
    this.displayExistingImages(news.images || []);

    document.getElementById('edit-modal').style.display = 'flex';
  }

  /**
   * Quillエディターにコンテンツを設定
   * HTMLまたはプレーンテキストに対応
   */
  setQuillContent(body) {
    if (!body) {
      this.quillEditor.setContents([]);
      return;
    }

    // HTMLタグが含まれているかチェック
    const hasHtmlTags = /<[^>]+>/.test(body);

    if (hasHtmlTags) {
      // HTMLとして設定
      this.quillEditor.clipboard.dangerouslyPasteHTML(body);
    } else {
      // プレーンテキストの場合、改行を保持してテキストとして設定
      this.quillEditor.setText(body);
    }
  }

  /**
   * 既存画像を表示
   */
  displayExistingImages(images) {
    const previewContainer = document.getElementById('image-preview-container');
    previewContainer.innerHTML = '';

    images.forEach(imagePath => {
      const previewItem = document.createElement('div');
      previewItem.className = 'image-preview-item';

      const img = document.createElement('img');
      img.src = `/${imagePath}`;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'image-preview-remove';
      removeBtn.textContent = '×';
      removeBtn.type = 'button';

      removeBtn.addEventListener('click', () => {
        const index = this.uploadedImages.indexOf(imagePath);
        if (index > -1) {
          this.uploadedImages.splice(index, 1);
        }
        previewItem.remove();
      });

      previewItem.appendChild(img);
      previewItem.appendChild(removeBtn);
      previewContainer.appendChild(previewItem);
    });
  }

  /**
   * モーダルを閉じる
   */
  closeModal() {
    document.getElementById('edit-modal').style.display = 'none';
    this.uploadedImages = [];
  }

  /**
   * お知らせを保存
   */
  async saveNews() {
    const formData = new FormData(document.getElementById('news-form'));
    const status = formData.get('status');

    // QuillエディターからHTMLを取得
    const bodyHtml = this.quillEditor.root.innerHTML;

    // hidden inputにも値を設定（バリデーション用）
    document.getElementById('news-body').value = bodyHtml;

    const newsItem = {
      id: this.editingId || `news-${String(this.newsData.settings.nextId).padStart(3, '0')}`,
      title: formData.get('title'),
      slug: formData.get('slug'),
      publishDate: formData.get('publishDate'),
      publishTime: '09:00', // デフォルト時刻
      body: bodyHtml, // QuillエディターからのHTML
      images: this.uploadedImages, // アップロード済み画像
      status: status,
      scheduledDate: status === 'scheduled' ?
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

    // サーバーに保存
    await this.saveToServer();

    // 詳細ページHTMLを作成
    await this.createNewsDetailPage(newsItem.slug);

    this.closeModal();
    await this.loadNewsData(); // 最新データを再読み込み
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
   * サーバーに保存
   */
  async saveToServer() {
    try {
      const response = await fetch(this.saveApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.newsData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Save failed');
      }

      alert('保存しました');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました: ' + error.message);
      throw error;
    }
  }

  /**
   * お知らせ詳細ページのHTMLファイルを作成
   */
  async createNewsDetailPage(slug) {
    try {
      const response = await fetch('/api/create-news-page.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ slug: slug })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create detail page');
      }

      console.log(`お知らせ詳細ページを作成しました: ${result.path}`);
    } catch (error) {
      console.error('詳細ページの作成に失敗しました:', error);
      // 詳細ページの作成失敗はデータ保存には影響しないため、エラーをログに残すのみ
    }
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
