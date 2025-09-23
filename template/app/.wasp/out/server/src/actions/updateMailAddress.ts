import { prisma } from 'wasp/server'

import { updateMailAddress } from '../../../../../src/address-management/operations'


export default async function (args, context) {
  return (updateMailAddress as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      MailAddress: prisma.mailAddress,
    },
  })
}
