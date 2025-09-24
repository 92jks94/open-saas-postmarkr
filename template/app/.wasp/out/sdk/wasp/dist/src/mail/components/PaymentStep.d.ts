import React from 'react';
import type { MailPiece, MailAddress, File } from 'wasp/entities';
/**
 * Props for the PaymentStep component
 */
interface PaymentStepProps {
    /** The mail piece to create payment for */
    mailPiece: MailPiece & {
        senderAddress: MailAddress;
        recipientAddress: MailAddress;
        file?: File | null;
    };
    /** Callback fired when payment is successfully completed */
    onPaymentSuccess?: (mailPieceId: string) => void;
    /** Callback fired when payment is cancelled or fails */
    onPaymentCancel?: () => void;
    /** Optional CSS classes for styling */
    className?: string;
}
/**
 * Main PaymentStep component using existing Wasp operations
 */
declare const PaymentStep: React.FC<PaymentStepProps>;
export default PaymentStep;
//# sourceMappingURL=PaymentStep.d.ts.map