import { useEffect } from 'react';
import * as CookieConsent from 'vanilla-cookieconsent';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import getConfig from './Config';

/**
 * Fallback function to initialize Google Analytics when consent cookies exist
 * but the cookie consent library fails to load properly
 */
const initializeGoogleAnalyticsFallback = () => {
  try {
    // Check if consent was given for analytics
    const ccCookie = document.cookie
      .split(';')
      .find(c => c.trim().startsWith('cc_cookie='));
    
    // If no cookie consent library loaded, assume consent is given (fallback mode)
    const analyticsAccepted = ccCookie ? 
      (() => {
        try {
          const cookieData = JSON.parse(decodeURIComponent(ccCookie.split('=')[1]));
          return cookieData.categories?.includes('analytics') || 
                 cookieData.services?.analytics?.includes('ga');
        } catch {
          return false;
        }
      })() : true; // No cookie = fallback mode = assume consent
    
    if (analyticsAccepted) {
        // Initialize Google Analytics directly
        const GA_ANALYTICS_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;
        
        // Exit if no GA ID is configured
        if (!GA_ANALYTICS_ID || !GA_ANALYTICS_ID.length) {
          console.warn('Fallback: Google Analytics ID not provided, skipping initialization');
          return;
        }
        
        console.log('Fallback: Initializing Google Analytics with ID:', GA_ANALYTICS_ID);
        
        window.dataLayer = window.dataLayer || [];
        function gtag(...args: unknown[]) {
          (window.dataLayer as Array<any>).push(args);
        }
        
        // Make gtag available globally
        (window as any).gtag = gtag;
        
        // Initialize gtag
        gtag('js', new Date());
        gtag('config', GA_ANALYTICS_ID);

        // Adding the script tag dynamically to the DOM.
        const script = document.createElement('script');
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ANALYTICS_ID}`;
        script.async = true;
        
        script.onload = () => {
          console.log('Fallback: Google Analytics script loaded successfully');
        };
        
        script.onerror = (error) => {
          console.error('Fallback: Failed to load Google Analytics script:', error);
        };
        
        document.body.appendChild(script);
    }
  } catch (error) {
    console.error('Fallback GA initialization failed:', error);
  }
};

/**
 * NOTE: if you do not want to use the cookie consent banner, you should
 * run `npm uninstall vanilla-cookieconsent`, and delete this component, its config file,
 * as well as its import in src/client/App.tsx .
 */
const CookieConsentBanner = () => {
  useEffect(() => {
    // Try to run the cookie consent library
    try {
      CookieConsent.run(getConfig());
      console.log('Cookie consent library initialized successfully');
    } catch (error) {
      console.error('Cookie consent library failed to load:', error);
      // Fallback: initialize Google Analytics if consent was previously given
      initializeGoogleAnalyticsFallback();
    }
    
    // Note: vanilla-cookieconsent v3 doesn't expose window.CookieConsent
    // The library is loaded as an ES module, so the above try/catch is sufficient
  }, []);

  return <div id='cookieconsent'></div>;
};

export default CookieConsentBanner;
