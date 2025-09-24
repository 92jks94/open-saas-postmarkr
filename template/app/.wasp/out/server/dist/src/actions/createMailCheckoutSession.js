import { prisma } from 'wasp/server';
import { createMailCheckoutSession } from '../../../../../src/mail/operations';
export default async function (args, context) {
    return createMailCheckoutSession(args, {
        ...context,
        entities: {
            MailPiece: prisma.mailPiece,
            MailAddress: prisma.mailAddress,
            MailPieceStatusHistory: prisma.mailPieceStatusHistory,
        },
    });
}
//# sourceMappingURL=createMailCheckoutSession.js.map