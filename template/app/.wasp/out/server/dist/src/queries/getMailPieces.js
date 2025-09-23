import { prisma } from 'wasp/server';
import { getMailPieces } from '../../../../../src/mail/operations';
export default async function (args, context) {
    return getMailPieces(args, {
        ...context,
        entities: {
            MailPiece: prisma.mailPiece,
            MailAddress: prisma.mailAddress,
            File: prisma.file,
            MailPieceStatusHistory: prisma.mailPieceStatusHistory,
        },
    });
}
//# sourceMappingURL=getMailPieces.js.map