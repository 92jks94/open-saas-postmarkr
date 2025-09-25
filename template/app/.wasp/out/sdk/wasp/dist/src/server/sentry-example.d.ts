/**
 * Example of how to use Sentry in your Wasp operations
 *
 * This file shows how to integrate Sentry error tracking and performance monitoring
 * into your existing operations. You can copy these patterns to your actual operation files.
 */
export declare function exampleOperationWithSentry(args: any, context: any): Promise<{
    processed: boolean;
    data: any;
}>;
export declare const wrappedOperation: (args: any, context: any) => Promise<{
    success: boolean;
}>;
//# sourceMappingURL=sentry-example.d.ts.map