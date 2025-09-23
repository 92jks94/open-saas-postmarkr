import { prisma } from 'wasp/server'

import { updateMailPiece } from '../../../../../src/mail/operations'


export default async function (args, context) {
  return (updateMailPiece as any)(args, {
    ...context,
    entities: {
      MailPiece: prisma.mailPiece,
      MailAddress: prisma.mailAddress,
      File: prisma.file,
      MailPieceStatusHistory: prisma.mailPieceStatusHistory,
    },
  })
}
