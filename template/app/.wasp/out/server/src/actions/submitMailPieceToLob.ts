import { prisma } from 'wasp/server'

import { submitMailPieceToLob } from '../../../../../src/mail/operations'


export default async function (args, context) {
  return (submitMailPieceToLob as any)(args, {
    ...context,
    entities: {
      MailPiece: prisma.mailPiece,
      MailAddress: prisma.mailAddress,
      File: prisma.file,
      MailPieceStatusHistory: prisma.mailPieceStatusHistory,
    },
  })
}
