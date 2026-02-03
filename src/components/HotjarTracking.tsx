import React, { useEffect, useRef } from 'react';

interface HotjarTrackingProps {
  hotjarId?: string;
}

const HotjarTracking: React.FC<HotjarTrackingProps> = ({
  hotjarId = "YOUR_HOTJAR_ID" // Replace with actual Hotjar ID
}) => {
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization (already loaded in index.html)
    // Only initialize if Hotjar is not already loaded
    if (hasInitialized.current || (window as any).hj) {
      return;
    }

    hasInitialized.current = true;

    // Hotjar Tracking Code - only load if not already present
    if (hotjarId && hotjarId !== "YOUR_HOTJAR_ID") {
      (function(h: any, o: any, t: any, j: any, a?: any, r?: any) {
        h.hj = h.hj || function() {
          (h.hj.q = h.hj.q || []).push(arguments);
        };
        h._hjSettings = { hjid: hotjarId, hjsv: 6 };
        a = o.getElementsByTagName('head')[0];
        r = o.createElement('script');
        r.async = 1;
        r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
        a.appendChild(r);
      })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
    }
  }, []); // Remove hotjarId from dependencies to prevent reinitialization

  return null; // This component doesn't render anything
};

export default HotjarTracking;
