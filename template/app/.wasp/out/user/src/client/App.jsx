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
import { demoNavigationitems, marketingNavigationItems } from './components/NavBar/constants';
import CookieConsentBanner from './components/cookie-consent/Banner';
/**
 * Root application component that handles layout and navigation
 *
 * Layout Modes:
 * - Marketing: Landing page and pricing (no app navigation)
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
    const location = useLocation();
    const isMarketingPage = useMemo(() => {
        return location.pathname === '/' || location.pathname.startsWith('/pricing');
    }, [location]);
    const navigationItems = isMarketingPage ? marketingNavigationItems : demoNavigationitems;
    const shouldDisplayAppNavBar = useMemo(() => {
        return (location.pathname !== routes.LoginRoute.build() && location.pathname !== routes.SignupRoute.build());
    }, [location]);
    const isAdminDashboard = useMemo(() => {
        return location.pathname.startsWith('/admin');
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
    return (<>
      <div className='min-h-screen bg-background text-foreground'>
        {isAdminDashboard ? (<Outlet />) : (<>
            {shouldDisplayAppNavBar && <NavBar navigationItems={navigationItems}/>}
            <div className='mx-auto max-w-screen-2xl'>
              <Outlet />
            </div>
          </>)}
      </div>
      <CookieConsentBanner />
    </>);
}
