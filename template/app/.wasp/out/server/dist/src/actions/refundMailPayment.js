import { prisma } from 'wasp/server';
import { refundMailPayment } from '../../../../../src/mail/operations';
export default async function (args, context) {
    return refundMailPayment(args, {
        ...context,
        entities: {
            MailPiece: prisma.mailPiece,
            MailPieceStatusHistory: prisma.mailPieceStatusHistory,
        },
    });
}
//# sourceMappingURL=refundMailPayment.js.map