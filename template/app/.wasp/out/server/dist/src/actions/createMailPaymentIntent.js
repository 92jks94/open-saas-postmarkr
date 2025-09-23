import { prisma } from 'wasp/server';
import { createMailPaymentIntent } from '../../../../../src/mail/operations';
export default async function (args, context) {
    return createMailPaymentIntent(args, {
        ...context,
        entities: {
            MailPiece: prisma.mailPiece,
            MailAddress: prisma.mailAddress,
            MailPieceStatusHistory: prisma.mailPieceStatusHistory,
        },
    });
}
//# sourceMappingURL=createMailPaymentIntent.js.map