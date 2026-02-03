import React, { useEffect, useRef } from 'react';
import HotjarTracking from './HotjarTracking';
import FacebookPixel from './FacebookPixel';

interface AnalyticsTrackingProps {
  hotjarId?: string;
  facebookPixelId?: string;
  googleAnalyticsId?: string;
}

const AnalyticsTracking: React.FC<AnalyticsTrackingProps> = ({
  hotjarId = import.meta.env.VITE_HOTJAR_ID || "YOUR_HOTJAR_ID",
  facebookPixelId = import.meta.env.VITE_FACEBOOK_PIXEL_ID || "YOUR_PIXEL_ID",
  googleAnalyticsId = import.meta.env.VITE_GA_ID || "YOUR_GA_ID"
}) => {
  const hasInitializedGA = useRef(false);

  useEffect(() => {
    // Prevent double initialization of Google Analytics
    if (hasInitializedGA.current || (window as any).gtag) {
      return;
    }

    // Google Analytics 4 - only initialize once
    if (googleAnalyticsId && googleAnalyticsId !== "YOUR_GA_ID") {
      hasInitializedGA.current = true;

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(args);
      }
      gtag('js', new Date());
      gtag('config', googleAnalyticsId);
    }
  }, []); // Remove googleAnalyticsId from dependencies

  return (
    <>
      <HotjarTracking hotjarId={hotjarId} />
      <FacebookPixel pixelId={facebookPixelId} />
    </>
  );
};

export default AnalyticsTracking;
