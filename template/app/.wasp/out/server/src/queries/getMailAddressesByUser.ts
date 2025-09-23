import { prisma } from 'wasp/server'

import { getMailAddressesByUser } from '../../../../../src/address-management/operations'


export default async function (args, context) {
  return (getMailAddressesByUser as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      MailAddress: prisma.mailAddress,
    },
  })
}
