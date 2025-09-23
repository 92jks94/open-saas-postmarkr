import { prisma } from 'wasp/server';
import { confirmMailPayment } from '../../../../../src/mail/operations';
export default async function (args, context) {
    return confirmMailPayment(args, {
        ...context,
        entities: {
            MailPiece: prisma.mailPiece,
            MailPieceStatusHistory: prisma.mailPieceStatusHistory,
        },
    });
}
//# sourceMappingURL=confirmMailPayment.js.map