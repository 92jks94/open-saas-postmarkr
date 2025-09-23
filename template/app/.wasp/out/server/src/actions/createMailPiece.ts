import { prisma } from 'wasp/server'

import { createMailPiece } from '../../../../../src/mail/operations'


export default async function (args, context) {
  return (createMailPiece as any)(args, {
    ...context,
    entities: {
      MailPiece: prisma.mailPiece,
      MailAddress: prisma.mailAddress,
      File: prisma.file,
      MailPieceStatusHistory: prisma.mailPieceStatusHistory,
    },
  })
}
