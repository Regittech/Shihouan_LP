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
