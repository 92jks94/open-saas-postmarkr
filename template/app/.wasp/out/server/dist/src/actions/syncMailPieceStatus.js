import { prisma } from 'wasp/server';
import { syncMailPieceStatus } from '../../../../../src/mail/operations';
export default async function (args, context) {
    return syncMailPieceStatus(args, {
        ...context,
        entities: {
            MailPiece: prisma.mailPiece,
            MailPieceStatusHistory: prisma.mailPieceStatusHistory,
        },
    });
}
//# sourceMappingURL=syncMailPieceStatus.js.map