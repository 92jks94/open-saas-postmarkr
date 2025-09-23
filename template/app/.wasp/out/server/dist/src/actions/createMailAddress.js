import { prisma } from 'wasp/server';
import { createMailAddress } from '../../../../../src/address-management/operations';
export default async function (args, context) {
    return createMailAddress(args, {
        ...context,
        entities: {
            User: prisma.user,
            MailAddress: prisma.mailAddress,
        },
    });
}
//# sourceMappingURL=createMailAddress.js.map