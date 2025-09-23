import { prisma } from 'wasp/server';
import { updateMailPieceStatus } from '../../../../../src/mail/operations';
export default async function (args, context) {
    return updateMailPieceStatus(args, {
        ...context,
        entities: {
            MailPiece: prisma.mailPiece,
            MailPieceStatusHistory: prisma.mailPieceStatusHistory,
        },
    });
}
//# sourceMappingURL=updateMailPieceStatus.js.map