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
    
    if (ccCookie) {
      const cookieData = JSON.parse(decodeURIComponent(ccCookie.split('=')[1]));
      const analyticsAccepted = cookieData.categories?.includes('analytics') || 
                               cookieData.services?.analytics?.includes('ga');
      
      if (analyticsAccepted) {
        // Initialize Google Analytics directly
        const GA_ANALYTICS_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID || 'G-6H2SB3GJDW';
        if (GA_ANALYTICS_ID) {
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
      }
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
    } catch (error) {
      console.error('Cookie consent library failed to load:', error);
      // Fallback: initialize Google Analytics if consent was previously given
      initializeGoogleAnalyticsFallback();
    }
    
    // Additional fallback: check after a delay if library didn't load
    const timeoutId = setTimeout(() => {
      if (typeof window.CookieConsent === 'undefined') {
        console.log('Cookie consent library not loaded, running fallback');
        initializeGoogleAnalyticsFallback();
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, []);

  return <div id='cookieconsent'></div>;
};

export default CookieConsentBanner;
