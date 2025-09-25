import { initSentry } from './sentry';
// Initialize Sentry on server startup
initSentry();
// Server middleware configuration function
export function serverMiddlewareConfigFn(app) {
    // Sentry is already initialized above
    // The integrations will automatically handle request tracking
    return app;
}
//# sourceMappingURL=setup.js.map