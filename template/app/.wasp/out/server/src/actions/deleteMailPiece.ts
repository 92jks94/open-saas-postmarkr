import { prisma } from 'wasp/server'

import { deleteMailPiece } from '../../../../../src/mail/operations'


export default async function (args, context) {
  return (deleteMailPiece as any)(args, {
    ...context,
    entities: {
      MailPiece: prisma.mailPiece,
      MailPieceStatusHistory: prisma.mailPieceStatusHistory,
    },
  })
}
