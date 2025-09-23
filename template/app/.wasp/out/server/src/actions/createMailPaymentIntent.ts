import { prisma } from 'wasp/server'

import { createMailPaymentIntent } from '../../../../../src/mail/operations'


export default async function (args, context) {
  return (createMailPaymentIntent as any)(args, {
    ...context,
    entities: {
      MailPiece: prisma.mailPiece,
      MailAddress: prisma.mailAddress,
      MailPieceStatusHistory: prisma.mailPieceStatusHistory,
    },
  })
}
