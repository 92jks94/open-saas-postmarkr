import { prisma } from 'wasp/server'

import { createMailCheckoutSession } from '../../../../../src/mail/operations'


export default async function (args, context) {
  return (createMailCheckoutSession as any)(args, {
    ...context,
    entities: {
      MailPiece: prisma.mailPiece,
      MailAddress: prisma.mailAddress,
      MailPieceStatusHistory: prisma.mailPieceStatusHistory,
    },
  })
}
