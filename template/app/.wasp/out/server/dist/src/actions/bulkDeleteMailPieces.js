import { prisma } from 'wasp/server';
import { bulkDeleteMailPieces } from '../../../../../src/mail/operations';
export default async function (args, context) {
    return bulkDeleteMailPieces(args, {
        ...context,
        entities: {
            MailPiece: prisma.mailPiece,
            MailPieceStatusHistory: prisma.mailPieceStatusHistory,
        },
    });
}
//# sourceMappingURL=bulkDeleteMailPieces.js.map