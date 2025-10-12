import type { CookieConsentConfig } from 'vanilla-cookieconsent';
import { COOKIE_CONSENT_EXPIRY_DAYS } from '../../../shared/constants/timing';

declare global {
  interface Window {
    dataLayer: any;
  }
}

const getConfig = () => {
  // See https://cookieconsent.orestbida.com/reference/configuration-reference.html for configuration options.
  const config: CookieConsentConfig = {
    // Default configuration for the modal.
    root: 'body',
    autoShow: true,
    disablePageInteraction: false,
    hideFromBots: import.meta.env.PROD ? true : false, // Set this to false for dev/headless tests otherwise the modal will not be visible.
    mode: 'opt-in',
    revision: 0,

    // Default configuration for the cookie.
    cookie: {
      name: 'cc_cookie',
      domain: location.hostname,
      path: '/',
      sameSite: 'Lax',
      expiresAfterDays: COOKIE_CONSENT_EXPIRY_DAYS,
    },

    guiOptions: {
      consentModal: {
        layout: 'box',
        position: 'bottom right',
        equalWeightButtons: true,
        flipButtons: false,
      },
    },

    categories: {
      necessary: {
        enabled: true, // this category is enabled by default
        readOnly: true, // this category cannot be disabled
      },
      analytics: {
        autoClear: {
          cookies: [
            {
              name: /^_ga/, // regex: match all cookies starting with '_ga'
            },
            {
              name: '_gid', // string: exact cookie name
            },
          ],
        },

        // https://cookieconsent.orestbida.com/reference/configuration-reference.html#category-services
        services: {
          ga: {
            label: 'Google Analytics',
            onAccept: () => {
              try {
                console.group('🔵 Google Analytics - Cookie Consent Accepted');
                console.log('⏱️  Timestamp:', new Date().toISOString());
                console.log('📍 Location:', window.location.href);
                
                // Get Google Analytics ID from environment variable
                // This is a public identifier visible in the browser, not sensitive
                const GA_ANALYTICS_ID = import.meta.env.REACT_APP_GOOGLE_ANALYTICS_ID;
                
                if (!GA_ANALYTICS_ID) {
                  console.warn('⚠️  Google Analytics ID not configured');
                  console.warn('💡 Set REACT_APP_GOOGLE_ANALYTICS_ID in .env.client');
                  console.groupEnd();
                  return;
                }
                
                console.log('✅ Google Analytics ID:', GA_ANALYTICS_ID);
                console.log('🚀 Initializing Google Analytics with gtag...');
                
                // Initialize dataLayer first
                window.dataLayer = window.dataLayer || [];
                function gtag(...args: unknown[]) {
                  (window.dataLayer as Array<any>).push(args);
                }
                
                // Make gtag available globally
                (window as any).gtag = gtag;
                
                // Initialize gtag with current timestamp
                gtag('js', new Date());
                
                // Configure Google Analytics with our measurement ID
                console.log('📝 Calling gtag(\'config\', \'' + GA_ANALYTICS_ID + '\')...');
                gtag('config', GA_ANALYTICS_ID, {
                  anonymize_ip: true, // Privacy: anonymize IP addresses
                  cookie_flags: 'SameSite=None;Secure', // Cookie security
                });
                
                // Load the Google Analytics script dynamically
                console.log('📦 Loading Google Analytics script...');
                const script = document.createElement('script');
                script.async = true;
                script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ANALYTICS_ID}`;
                script.onload = () => {
                  console.log('✅ Google Analytics script loaded successfully');
                };
                script.onerror = () => {
                  console.error('❌ Failed to load Google Analytics script');
                  console.error('   This might be due to ad blockers or CSP policies');
                };
                document.head.appendChild(script);
                
                console.log('✅ Google Analytics initialized successfully');
                console.log('📊 dataLayer:', window.dataLayer);
                console.groupEnd();
                
              } catch (error) {
                console.error('❌ Google Analytics initialization error');
                console.error('🔍 Error:', error);
                console.error('📚 Stack:', error instanceof Error ? error.stack : 'No stack trace');
                console.groupEnd();
              }
            },
            onReject: () => {
              console.log('🔴 Google Analytics - Cookie Consent Rejected');
              console.log('⏱️  Timestamp:', new Date().toISOString());
            },
          },
        },
      },
    },

    language: {
      default: 'en',
      translations: {
        en: {
          consentModal: {
            title: 'We use cookies',
            description:
              'We use cookies primarily for analytics to enhance your experience. By accepting, you agree to our use of these cookies. You can manage your preferences or learn more about our cookie policy.',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject all',
            // showPreferencesBtn: 'Manage Individual preferences', // (OPTIONAL) Activates the preferences modal
            // TODO: Add your own privacy policy and terms and conditions links below.
            footer: `
            <a href="<your-url-here>" target="_blank">Privacy Policy</a>
            <a href="<your-url-here>" target="_blank">Terms and Conditions</a>
                    `,
          },
          // The showPreferencesBtn activates this modal to manage individual preferences https://cookieconsent.orestbida.com/reference/configuration-reference.html#translation-preferencesmodal
          preferencesModal: {
            sections: [],
          },
        },
      },
    },
  };

  return config;
};

export default getConfig;