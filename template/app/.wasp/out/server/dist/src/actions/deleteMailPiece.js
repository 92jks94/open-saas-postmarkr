import { prisma } from 'wasp/server';
import { deleteMailPiece } from '../../../../../src/mail/operations';
export default async function (args, context) {
    return deleteMailPiece(args, {
        ...context,
        entities: {
            MailPiece: prisma.mailPiece,
            MailPieceStatusHistory: prisma.mailPieceStatusHistory,
        },
    });
}
//# sourceMappingURL=deleteMailPiece.js.map