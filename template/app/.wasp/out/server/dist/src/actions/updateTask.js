import { prisma } from 'wasp/server';
import { updateTask } from '../../../../../src/demo-ai-app/operations';
export default async function (args, context) {
    return updateTask(args, {
        ...context,
        entities: {
            Task: prisma.task,
        },
    });
}
//# sourceMappingURL=updateTask.js.map