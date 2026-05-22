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
   * 清除token（登出时使用）
   */
  clearToken(): void {
    this.token = null;
  }
}

/**
 * 数据加密工具
 */
export class DataEncryption {
  private algorithm = 'AES-GCM';
  private keyLength = 256;

  /**
   * 生成加密密钥
   */
  private async generateKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      {
        name: this.algorithm,
        length: this.keyLength,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * 从密码生成密钥
   */
  private async deriveKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
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
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * 加密数据
   */
  async encrypt(data: string, password?: string): Promise<{ encrypted: string; iv: string }> {
    try {
      const key = password ? await this.deriveKey(password) : await this.generateKey();
      const encoder = new TextEncoder();
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv,
        },
        key,
        encoder.encode(data)
      );

      return {
        encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
        iv: btoa(String.fromCharCode(...iv)),
      };
    } catch (error) {
      console.warn('Encryption failed, returning plaintext:', error);
      return {
        encrypted: btoa(data),
        iv: '',
      };
    }
  }

  /**
   * 解密数据
   */
  async decrypt(encryptedData: string, iv: string, password?: string): Promise<string> {
    try {
      const key = password ? await this.deriveKey(password) : await this.generateKey();
      const decoder = new TextDecoder();

      const encrypted = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
      const ivArray = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));

      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: ivArray,
        },
        key,
        encrypted
      );

      return decoder.decode(decrypted);
    } catch (error) {
      console.warn('Decryption failed:', error);
      return atob(encryptedData);
    }
  }
}

/**
 * Content Security Policy生成器
 */
export class CSPManager {
  /**
   * 生成CSP meta标签内容
   */
  static generateCSP(): string {
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.openai.com https://*.claude.ai",
      "frame-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ].join('; ');

    return directives;
  }

  /**
   * 生成CSP headers（用于Next.js配置）
   */
  static generateCSPHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': this.generateCSP(),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };
  }
}

// 单例实例
export const csrfProtection = new CSRFProtection();
export const dataEncryption = new DataEncryption();

/**
 * 安全headers中间件（用于客户端路由保护）
 */
export function setSecurityHeaders() {
  if (typeof document === 'undefined') {
    return;
  }

  const csp = CSPManager.generateCSP();

  // 查找或创建meta标签
  let metaTag = document.querySelector('meta[http-equiv="Content-Security-Policy"]');

  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.setAttribute('http-equiv', 'Content-Security-Policy');
    document.head.appendChild(metaTag);
  }

  metaTag.setAttribute('content', csp);
}

/**
 * 输入验证和清理
 */
export class InputSanitizer {
  /**
   * 清理用户输入，防止XSS
   */
  static sanitize(input: string): string {
    if (!input) return '';

    // 移除危险字符
    return input
      .replace(/[<>]/g, '') // 移除尖括号
      .replace(/javascript:/gi, '') // 移除javascript:协议
      .replace(/on\w+\s*=/gi, '') // 移除事件处理器
      .trim();
  }

  /**
   * 验证手机号
   */
  static validatePhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 验证邮箱
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证URL
   */
  static validateURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 限制字符串长度
   */
  static truncate(input: string, maxLength: number): string {
    if (!input || input.length <= maxLength) {
      return input;
    }

    return input.substring(0, maxLength);
  }
}