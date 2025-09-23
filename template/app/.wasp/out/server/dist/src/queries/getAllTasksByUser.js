import { prisma } from 'wasp/server';
import { getAllTasksByUser } from '../../../../../src/demo-ai-app/operations';
export default async function (args, context) {
    return getAllTasksByUser(args, {
        ...context,
        entities: {
            Task: prisma.task,
        },
    });
}
//# sourceMappingURL=getAllTasksByUser.js.map