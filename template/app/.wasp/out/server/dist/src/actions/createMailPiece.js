import { prisma } from 'wasp/server';
import { createMailPiece } from '../../../../../src/mail/operations';
export default async function (args, context) {
    return createMailPiece(args, {
        ...context,
        entities: {
            MailPiece: prisma.mailPiece,
            MailAddress: prisma.mailAddress,
            File: prisma.file,
            MailPieceStatusHistory: prisma.mailPieceStatusHistory,
        },
    });
}
//# sourceMappingURL=createMailPiece.js.map