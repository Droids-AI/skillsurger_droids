import React, { useEffect, useRef } from 'react';
import HotjarTracking from './HotjarTracking';
import FacebookPixel from './FacebookPixel';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../lib/analytics';
import { captureAttribution } from '../lib/attribution';

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
  const location = useLocation();

  useEffect(() => {
    // Prevent double initialization of Google Analytics
    if (hasInitializedGA.current) {
      return;
    }

    // Google Analytics 4 - only initialize once
    if (googleAnalyticsId && googleAnalyticsId !== "YOUR_GA_ID") {
      hasInitializedGA.current = true;

      if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`;
        document.head.appendChild(script);
      }
      // Page views are sent below on every route change, including the first.
      window.gtag?.('config', googleAnalyticsId, { send_page_view: false });
    }
  }, [googleAnalyticsId]);

  useEffect(() => { captureAttribution(); }, []);
  useEffect(() => { trackPageView(location.pathname); }, [location.pathname]);

  return (
    <>
      <HotjarTracking hotjarId={hotjarId} />
      <FacebookPixel pixelId={facebookPixelId} />
    </>
  );
};

export default AnalyticsTracking;
