/**
 * SEO Provider
 * 
 * Wraps the application with HelmetProvider from react-helmet-async.
 * This must be placed high in the component tree, typically in App.tsx.
 * 
 * Usage:
 * ```tsx
 * import { SeoProvider } from './seo/SeoProvider';
 * 
 * function App() {
 *   return (
 *     <SeoProvider>
 *       <YourApp />
 *     </SeoProvider>
 *   );
 * }
 * ```
 */

import { HelmetProvider } from 'react-helmet-async';

interface SeoProviderProps {
  children: React.ReactNode;
}

export function SeoProvider({ children }: SeoProviderProps) {
  return <HelmetProvider>{children}</HelmetProvider>;
}

