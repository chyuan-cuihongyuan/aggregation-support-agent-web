/**
 * 性能监控工具
 * 集成Web Vitals和性能指标收集
 * 已适配 web-vitals 5.x API
 */

export type Metric = {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
};

export type PerformanceReport = {
  metrics: Metric[];
  timestamp: number;
  url: string;
};

/**
 * 评估性能指标等级
 */
function getRating(score: number, thresholds: { good: number; poor: number }): Metric['rating'] {
  if (score <= thresholds.good) return 'good';
  if (score <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * 收集Web Vitals指标
 * 适配 web-vitals 5.x API：使用 onCLS/onFCP/onINP/onLCP/onTTFB
 */
export async function collectWebVitals(): Promise<Metric[]> {
  const metrics: Metric[] = [];

  try {
    // 动态导入web-vitals
    const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import('web-vitals');

    // CLS (Cumulative Layout Shift) - 布局稳定性
    const clsPromise = new Promise<void>((resolve) => {
      onCLS((metric) => {
        metrics.push({
          name: 'CLS',
          value: metric.value,
          rating: getRating(metric.value, { good: 0.1, poor: 0.25 }),
        });
        resolve();
      });
    });

    // INP (Interaction to Next Paint) - 交互响应性（替代 FID）
    const inpPromise = new Promise<void>((resolve) => {
      onINP((metric) => {
        metrics.push({
          name: 'INP',
          value: metric.value,
          rating: getRating(metric.value, { good: 200, poor: 500 }),
        });
        resolve();
      });
    });

    // FCP (First Contentful Paint) - 首次内容绘制
    const fcpPromise = new Promise<void>((resolve) => {
      onFCP((metric) => {
        metrics.push({
          name: 'FCP',
          value: metric.value,
          rating: getRating(metric.value, { good: 1800, poor: 3000 }),
        });
        resolve();
      });
    });

    // LCP (Largest Contentful Paint) - 最大内容绘制
    const lcpPromise = new Promise<void>((resolve) => {
      onLCP((metric) => {
        metrics.push({
          name: 'LCP',
          value: metric.value,
          rating: getRating(metric.value, { good: 2500, poor: 4000 }),
        });
        resolve();
      });
    });

    // TTFB (Time to First Byte) - 首字节时间
    const ttfbPromise = new Promise<void>((resolve) => {
      onTTFB((metric) => {
        metrics.push({
          name: 'TTFB',
          value: metric.value,
          rating: getRating(metric.value, { good: 800, poor: 1800 }),
        });
        resolve();
      });
    });

    // 等待所有指标收集完成
    await Promise.all([clsPromise, inpPromise, fcpPromise, lcpPromise, ttfbPromise]);

  } catch (error) {
    console.warn('Failed to collect web vitals:', error);
  }

  return metrics;
}

/**
 * 收集自定义性能指标
 */
export function collectCustomMetrics(): Metric[] {
  const metrics: Metric[] = [];

  if (typeof window === 'undefined') {
    return metrics;
  }

  // 内存使用情况
  interface MemoryInfo {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  }
  const performanceWithMemory = performance as Performance & { memory?: MemoryInfo };
  if (performanceWithMemory.memory) {
    const memory = performanceWithMemory.memory;
    const usedMB = memory.usedJSHeapSize / (1024 * 1024);
    const totalMB = memory.totalJSHeapSize / (1024 * 1024);

    metrics.push({
      name: 'Memory Usage',
      value: usedMB,
      rating: getRating(usedMB, { good: totalMB * 0.5, poor: totalMB * 0.8 }),
    });
  }

  // 网络信息
  interface NetworkInformation {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  }
  const navigatorWithConnection = navigator as Navigator & { connection?: NetworkInformation };
  if (navigatorWithConnection.connection) {
    const connection = navigatorWithConnection.connection;
    if (connection) {
      metrics.push({
        name: 'Network Type',
        value: connection.effectiveType ? connection.effectiveType.length : 0,
        rating: 'good' as const,
      });
    }
  }

  return metrics;
}

/**
 * 生成性能报告
 */
export async function generatePerformanceReport(): Promise<PerformanceReport> {
  const webVitals = await collectWebVitals();
  const customMetrics = collectCustomMetrics();

  return {
    metrics: [...webVitals, ...customMetrics],
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.href : '',
  };
}

/**
 * 上报性能数据到监控服务
 */
export function reportPerformance(report: PerformanceReport, endpoint?: string) {
  if (!endpoint) {
    console.log('Performance Report:', report);
    return;
  }

  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  }).catch((error) => {
    console.warn('Failed to report performance:', error);
  });
}

/**
 * 计算性能分数
 */
export function calculatePerformanceScore(metrics: Metric[]): number {
  if (metrics.length === 0) return 0;

  let totalScore = 0;
  let maxScore = 0;

  metrics.forEach((metric) => {
    maxScore += 100;

    switch (metric.rating) {
      case 'good':
        totalScore += 100;
        break;
      case 'needs-improvement':
        totalScore += 50;
        break;
      case 'poor':
        totalScore += 0;
        break;
    }
  });

  return Math.round((totalScore / maxScore) * 100);
}

/**
 * 监控页面加载性能
 */
export function observePagePerformance(callback: (report: PerformanceReport) => void) {
  if (typeof window === 'undefined') {
    return;
  }

  // 等待页面完全加载
  window.addEventListener('load', async () => {
    // 延迟一点以确保所有指标都收集完毕
    setTimeout(async () => {
      const report = await generatePerformanceReport();
      callback(report);
    }, 1000);
  });
}
