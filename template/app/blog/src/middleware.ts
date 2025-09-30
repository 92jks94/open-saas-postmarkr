import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = (context, next) => {
  const { url } = context;
  
  // Check if the URL contains .md extension in blog paths
  if (url.pathname.includes('/blog/') && url.pathname.endsWith('.md/')) {
    // Remove the .md extension and redirect
    const cleanPath = url.pathname.replace('.md/', '/');
    return context.redirect(cleanPath + url.search);
  }
  
  return next();
};
