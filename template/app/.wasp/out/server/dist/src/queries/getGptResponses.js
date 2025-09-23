import { prisma } from 'wasp/server';
import { getGptResponses } from '../../../../../src/demo-ai-app/operations';
export default async function (args, context) {
    return getGptResponses(args, {
        ...context,
        entities: {
            User: prisma.user,
            GptResponse: prisma.gptResponse,
        },
    });
}
//# sourceMappingURL=getGptResponses.js.map