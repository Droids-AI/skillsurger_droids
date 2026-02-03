// Performance monitoring utilities

/**
 * Report Web Vitals to analytics
 */
export const reportWebVitals = (metric: any) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }
};

/**
 * Prefetch resources on idle
 */
export const prefetchOnIdle = (url: string) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }
};

/**
 * Defer non-critical JavaScript
 */
export const deferScript = (src: string, onLoad?: () => void) => {
  const script = document.createElement('script');
  script.src = src;
  script.defer = true;
  if (onLoad) {
    script.onload = onLoad;
  }
  document.body.appendChild(script);
};

/**
 * Optimize images with lazy loading
 */
export const optimizeImage = (img: HTMLImageElement) => {
  img.loading = 'lazy';
  img.decoding = 'async';
};

/**
 * Critical CSS inline (for above-the-fold content)
 */
export const inlineCriticalCSS = () => {
  const criticalCSS = `
    body { margin: 0; font-family: system-ui, sans-serif; }
    .min-h-screen { min-height: 100vh; }
    .bg-gray-50 { background-color: #f9fafb; }
  `;
  
  const style = document.createElement('style');
  style.textContent = criticalCSS;
  document.head.insertBefore(style, document.head.firstChild);
};

/**
 * Reduce layout shifts by reserving space for images
 */
export const reserveImageSpace = (width: number, height: number) => {
  return {
    aspectRatio: `${width} / ${height}`,
    width: '100%',
    height: 'auto',
  };
};

