// ============================================================================
// CORE APPLICATION LAYOUT AND ROUTING
// ============================================================================
// This is the root component that wraps all pages and handles:
// - Navigation bar display logic (marketing vs app vs admin)
// - Route-based layout switching
// - Global UI elements (cookie consent, etc.)

import { useEffect, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { routes } from 'wasp/client/router';
import './Main.css';
import NavBar from './components/NavBar/NavBar';
import { demoNavigationitems, marketingNavigationItems, adminNavigationItems } from './components/NavBar/constants';
// import CookieConsentBanner from './components/cookie-consent/Banner'; // COMMENTED OUT FOR TESTING
import { initSentry } from './sentry';
import './chromeExtensionErrorHandler'; // Import error handler
import Footer from '../landing-page/components/Footer';
import { footerNavigation } from '../landing-page/contentSections';

/**
 * Root application component that handles layout and navigation
 * 
 * Layout Modes:
 * - Marketing: Landing page (no app navigation)
 * - App: Authenticated user interface with main navigation
 * - Admin: Admin dashboard with specialized layout
 * 
 * Features:
 * - Conditional navigation bar display
 * - Route-based layout switching
 * - Global UI elements (cookie consent)
 * - Smooth scrolling for hash navigation
 */
export default function App() {
  // Initialize Sentry on app startup
  useEffect(() => {
    initSentry();
  }, []);

  // Initialize Google Analytics directly (no cookie consent for testing)
  useEffect(() => {
    const GA_ANALYTICS_ID = import.meta.env.REACT_APP_GOOGLE_ANALYTICS_ID;
    
    if (!GA_ANALYTICS_ID) {
      console.warn('⚠️  Google Analytics ID not configured');
      return;
    }

    console.log('🚀 Initializing Google Analytics directly (testing mode)');
    console.log('📊 GA ID:', GA_ANALYTICS_ID);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]) {
      (window.dataLayer as Array<any>).push(args);
    }
    
    // Make gtag available globally
    (window as any).gtag = gtag;
    
    // Initialize gtag
    gtag('js', new Date());
    gtag('config', GA_ANALYTICS_ID, {
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure',
    });
    
    // Load GA script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ANALYTICS_ID}`;
    script.onload = () => {
      console.log('✅ GA script loaded successfully (testing mode)');
    };
    script.onerror = () => {
      console.error('❌ Failed to load GA script');
    };
    document.head.appendChild(script);
    
    console.log('✅ GA initialization complete');
  }, []);

  const location = useLocation();
  const isMarketingPage = useMemo(() => {
    return location.pathname === '/';
  }, [location]);

  const isAdminDashboard = useMemo(() => {
    return location.pathname.startsWith('/admin');
  }, [location]);

  const navigationItems = useMemo(() => {
    if (isAdminDashboard) return adminNavigationItems;
    if (isMarketingPage) return marketingNavigationItems;
    return demoNavigationitems;
  }, [isMarketingPage, isAdminDashboard]);

  const shouldDisplayAppNavBar = useMemo(() => {
    return (
      location.pathname !== routes.LoginRoute.build() && 
      location.pathname !== routes.SignupRoute.build() &&
      location.pathname !== routes.EmailVerificationRoute.build()
    );
  }, [location]);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView();
      }
    }
  }, [location]);

  return (
    <>
      <div className='min-h-screen bg-background text-foreground flex flex-col'>
        {shouldDisplayAppNavBar && <NavBar navigationItems={navigationItems} />}
        
        <div className='flex-1 flex flex-col'>
          {isAdminDashboard ? (
            <Outlet />
          ) : (
            <>
              <div className='mx-auto max-w-screen-2xl flex-1'>
                <Outlet />
              </div>
              <Footer footerNavigation={footerNavigation} />
            </>
          )}
        </div>
      </div>
      {/* <CookieConsentBanner /> */} {/* COMMENTED OUT FOR TESTING */}
    </>
  );
}
