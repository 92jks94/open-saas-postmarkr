import { useEffect } from 'react';
import * as CookieConsent from 'vanilla-cookieconsent';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import getConfig from './Config';

/**
 * Fallback function to initialize Google Analytics when consent cookies exist
 * but the cookie consent library fails to load properly.
 * 
 * Since the Google Tag script is now loaded in the HTML <head>, this fallback
 * only needs to initialize gtag configuration if consent was previously given.
 */
const initializeGoogleAnalyticsFallback = () => {
  console.group('🟡 Google Analytics - Fallback Mode Initiated');
  try {
    console.log('⏱️  Timestamp:', new Date().toISOString());
    console.log('📍 Location:', window.location.href);
    
    // Check if consent was given for analytics
    const ccCookie = document.cookie
      .split(';')
      .find(c => c.trim().startsWith('cc_cookie='));
    
    console.log('🍪 Cookie consent cookie found?', !!ccCookie);
    
    // Parse cookie to check if analytics was accepted
    const analyticsAccepted = ccCookie ? 
      (() => {
        try {
          const cookieValue = ccCookie.split('=')[1];
          const cookieData = JSON.parse(decodeURIComponent(cookieValue));
          console.log('🍪 Parsed cookie data:', cookieData);
          const accepted = cookieData.categories?.includes('analytics') || 
                 cookieData.services?.analytics?.includes('ga');
          console.log('🍪 Analytics accepted from cookie?', accepted);
          return accepted;
        } catch (error) {
          console.error('🍪 Error parsing cookie:', error);
          return false;
        }
      })() : false; // No cookie = no previous consent
    
    console.log('✅ Analytics consent status:', analyticsAccepted ? 'ACCEPTED' : 'REJECTED');
    
    if (analyticsAccepted) {
        // Initialize Google Analytics with gtag config
        // Script is already loaded in HTML <head>, we just need to configure it
        const GA_ANALYTICS_ID = import.meta.env.REACT_APP_GOOGLE_ANALYTICS_ID;
        
        if (!GA_ANALYTICS_ID) {
          console.warn('⚠️  Fallback: Google Analytics ID not configured');
          console.warn('💡 Set REACT_APP_GOOGLE_ANALYTICS_ID in .env.client');
          console.groupEnd();
          return;
        }
        
        console.log('🚀 Fallback: Initializing Google Analytics with ID:', GA_ANALYTICS_ID);
        
        // Initialize dataLayer and gtag
        window.dataLayer = window.dataLayer || [];
        function gtag(...args: unknown[]) {
          (window.dataLayer as Array<any>).push(args);
        }
        
        // Make gtag available globally
        (window as any).gtag = gtag;
        
        // Initialize gtag with configuration
        gtag('js', new Date());
        
        gtag('config', GA_ANALYTICS_ID, {
          anonymize_ip: true,
          cookie_flags: 'SameSite=None;Secure',
        });
        
        // Load the Google Analytics script dynamically
        console.log('📦 Fallback: Loading Google Analytics script...');
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ANALYTICS_ID}`;
        script.onload = () => {
          console.log('✅ Fallback: Google Analytics script loaded successfully');
        };
        script.onerror = () => {
          console.error('❌ Fallback: Failed to load Google Analytics script');
        };
        document.head.appendChild(script);
        
        console.log('✅ Fallback: Google Analytics initialized');
        console.log('📊 dataLayer:', window.dataLayer);
        console.groupEnd();
    } else {
      console.log('❌ Analytics not accepted, skipping initialization');
      console.groupEnd();
    }
  } catch (error) {
    console.error('❌ Fallback GA initialization failed');
    console.error('🔍 Error:', error);
    console.error('📚 Stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.groupEnd();
  }
};

/**
 * NOTE: if you do not want to use the cookie consent banner, you should
 * run `npm uninstall vanilla-cookieconsent`, and delete this component, its config file,
 * as well as its import in src/client/App.tsx .
 */
const CookieConsentBanner = () => {
  useEffect(() => {
    console.group('🍪 Cookie Consent Banner - Initialization');
    console.log('⏱️  Timestamp:', new Date().toISOString());
    console.log('📍 Location:', window.location.href);
    console.log('🔍 Environment:', import.meta.env.MODE);
    
    // Try to run the cookie consent library
    try {
      const config = getConfig();
      console.log('📋 Cookie consent config generated');
      console.log('🔍 Config mode:', config.mode);
      console.log('🔍 Auto show?', config.autoShow);
      
      CookieConsent.run(config);
      console.log('✅ Cookie consent library initialized successfully');
      console.groupEnd();
    } catch (error) {
      console.error('❌ Cookie consent library failed to load');
      console.error('🔍 Error:', error);
      console.error('📚 Stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.groupEnd();
      // Fallback: initialize Google Analytics if consent was previously given
      initializeGoogleAnalyticsFallback();
    }
    
    // Note: vanilla-cookieconsent v3 doesn't expose window.CookieConsent
    // The library is loaded as an ES module, so the above try/catch is sufficient
  }, []);

  return <div id='cookieconsent'></div>;
};

export default CookieConsentBanner;
