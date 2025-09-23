import { prisma } from 'wasp/server'

import { deleteMailAddress } from '../../../../../src/address-management/operations'


export default async function (args, context) {
  return (deleteMailAddress as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      MailAddress: prisma.mailAddress,
    },
  })
}
