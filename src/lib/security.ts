/**
 * 安全工具函数
 * 提供CSRF保护、数据加密和安全headers功能
 */

/**
 * CSRF Token管理
 */
export class CSRFProtection {
  private token: string | null = null;
  private headerName = 'X-CSRF-Token';
  private tokenUrl = '/api/csrf-token';

  /**
   * 获取CSRF token
   */
  async getToken(): Promise<string> {
    if (this.token) {
      return this.token;
    }

    try {
      const response = await fetch(this.tokenUrl, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      this.token = data.token;

      if (!this.token) {
        throw new Error('Empty token received');
      }

      return this.token;
    } catch (error) {
      console.warn('CSRF token fetch failed, using fallback:', error);
      // 生成临时token
      this.token = this.generateTemporaryToken();
      return this.token;
    }
  }

  /**
   * 生成临时token（fallback）
   */
  private generateTemporaryToken(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }

  /**
   * 为请求添加CSRF headers
   */
  async addCSRFHeaders(headers: HeadersInit = {}): Promise<HeadersInit> {
    const token = await this.getToken();

    return {
      ...headers,
      [this.headerName]: token,
    };
  }

  /**
   * 验证CSRF token（用于响应验证）
   */
  validateToken(responseToken: string): boolean {
    if (!this.token) {
      return false;
    }

    // 简单验证：检查token是否匹配
    return responseToken === this.token;
  }

  /**
   * 重置token（用于登出等场景）
   */
  resetToken(): void {
    this.token = null;
  }
}

/**
 * 数据加密工具（简化版）
 */
export class DataEncryption {
  private algorithm = 'AES-GCM';
  private keyLength = 256;

  /**
   * 生成加密密钥
   */
  async generateKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: this.algorithm, length: this.keyLength },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * 加密数据
   */
  async encrypt(data: string, password: string): Promise<string> {
    try {
      const key = await this.generateKey(password);
      const encoder = new TextEncoder();
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encrypted = await crypto.subtle.encrypt(
        { name: this.algorithm, iv },
        key,
        encoder.encode(data)
      );

      // 组合 IV 和加密数据
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * 解密数据
   */
  async decrypt(encryptedData: string, password: string): Promise<string> {
    try {
      const key = await this.generateKey(password);
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: this.algorithm, iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}

/**
 * 安全 Headers 生成器
 */
export class SecurityHeaders {
  /**
   * 生成标准安全 headers
   */
  static getStandardHeaders(): HeadersInit {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };
  }

  /**
   * 生成 CSP (Content Security Policy) header
   */
  static getCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
    ].join('; ');
  }
}

// 单例实例
export const csrfProtection = new CSRFProtection();
export const dataEncryption = new DataEncryption();
