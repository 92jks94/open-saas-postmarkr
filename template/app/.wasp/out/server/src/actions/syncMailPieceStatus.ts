import { prisma } from 'wasp/server'

import { syncMailPieceStatus } from '../../../../../src/mail/operations'


export default async function (args, context) {
  return (syncMailPieceStatus as any)(args, {
    ...context,
    entities: {
      MailPiece: prisma.mailPiece,
      MailPieceStatusHistory: prisma.mailPieceStatusHistory,
    },
  })
}
