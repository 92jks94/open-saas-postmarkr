import { prisma } from 'wasp/server'

import { bulkDeleteMailPieces } from '../../../../../src/mail/operations'


export default async function (args, context) {
  return (bulkDeleteMailPieces as any)(args, {
    ...context,
    entities: {
      MailPiece: prisma.mailPiece,
      MailPieceStatusHistory: prisma.mailPieceStatusHistory,
    },
  })
}
