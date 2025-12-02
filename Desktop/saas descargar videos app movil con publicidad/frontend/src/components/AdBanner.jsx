import React, { useEffect, useRef } from 'react';
import './AdBanner.css';

const AdBanner = ({ adSlot = 'ca-pub-xxxxxxxxxx', format = 'auto', fullWidthResponsive = true }) => {
  const adRef = useRef(null);

  useEffect(() => {
    try {
      // Load AdSense script
      if (window.adsbygoogle && adRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <div className="ad-banner-container">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adSlot}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive}
      />
    </div>
  );
};

export default AdBanner;
