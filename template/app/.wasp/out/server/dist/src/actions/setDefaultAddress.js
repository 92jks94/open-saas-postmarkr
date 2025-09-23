import { prisma } from 'wasp/server';
import { setDefaultAddress } from '../../../../../src/address-management/operations';
export default async function (args, context) {
    return setDefaultAddress(args, {
        ...context,
        entities: {
            User: prisma.user,
            MailAddress: prisma.mailAddress,
        },
    });
}
//# sourceMappingURL=setDefaultAddress.js.map