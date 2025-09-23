import type { MailAddress } from 'wasp/entities';
/**
 * Create payment intent for mail cost
 */
export declare function createMailPaymentIntent(mailSpecs: {
    mailType: string;
    mailClass: string;
    mailSize: string;
    toAddress: MailAddress;
    fromAddress: MailAddress;
}, userId: string, context: any): Promise<{
    paymentIntentId: string;
    cost: number;
}>;
/**
 * Confirm payment before Lob submission
 */
export declare function confirmMailPayment(paymentIntentId: string, mailPieceId: string, context: any): Promise<boolean>;
/**
 * Handle refunds for failed mail processing
 */
export declare function refundMailPayment(paymentIntentId: string, mailPieceId: string, reason: string, context: any): Promise<boolean>;
