import { prisma } from 'wasp/server'

import { getMailPiece } from '../../../../../src/mail/operations'


export default async function (args, context) {
  return (getMailPiece as any)(args, {
    ...context,
    entities: {
      MailPiece: prisma.mailPiece,
      MailAddress: prisma.mailAddress,
      File: prisma.file,
      MailPieceStatusHistory: prisma.mailPieceStatusHistory,
    },
  })
}
