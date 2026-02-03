import React, { useEffect, useRef } from 'react';

interface FacebookPixelProps {
  pixelId?: string;
}

const FacebookPixel: React.FC<FacebookPixelProps> = ({
  pixelId = "YOUR_PIXEL_ID" // Replace with actual Facebook Pixel ID
}) => {
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization and only initialize once
    if (hasInitialized.current || (window as any).fbq) {
      return;
    }

    hasInitialized.current = true;

    // Facebook Pixel Code - only load if valid pixelId provided
    if (pixelId && pixelId !== "YOUR_PIXEL_ID") {
      !function(f: any, b: any, e: any, v: any, n: any, t: any, s: any) {
        if (f.fbq) return;
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

      // Initialize Facebook Pixel
      (window as any).fbq('init', pixelId);
      (window as any).fbq('track', 'PageView');
    }
  }, []); // Remove pixelId from dependencies to prevent reinitialization

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
};

export default FacebookPixel;
