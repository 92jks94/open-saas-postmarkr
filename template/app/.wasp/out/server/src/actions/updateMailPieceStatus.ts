import { prisma } from 'wasp/server'

import { updateMailPieceStatus } from '../../../../../src/mail/operations'


export default async function (args, context) {
  return (updateMailPieceStatus as any)(args, {
    ...context,
    entities: {
      MailPiece: prisma.mailPiece,
      MailPieceStatusHistory: prisma.mailPieceStatusHistory,
    },
  })
}
