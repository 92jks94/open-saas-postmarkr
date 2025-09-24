import { type MiddlewareConfigFn } from 'wasp/server';
import express from 'express';
/**
 * Handle Lob webhook for mail piece status updates
 */
export declare const lobWebhook: (request: express.Request, response: express.Response, context: any) => Promise<express.Response<any, Record<string, any>>>;
/**
 * Lob webhook middleware configuration
 */
export declare const lobMiddlewareConfigFn: MiddlewareConfigFn;
//# sourceMappingURL=webhook.d.ts.map