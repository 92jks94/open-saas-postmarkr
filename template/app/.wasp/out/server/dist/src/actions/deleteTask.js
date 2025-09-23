import { prisma } from 'wasp/server';
import { deleteTask } from '../../../../../src/demo-ai-app/operations';
export default async function (args, context) {
    return deleteTask(args, {
        ...context,
        entities: {
            Task: prisma.task,
        },
    });
}
//# sourceMappingURL=deleteTask.js.map