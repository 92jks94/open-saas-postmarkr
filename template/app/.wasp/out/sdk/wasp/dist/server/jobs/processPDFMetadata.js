import { prisma } from 'wasp/server';
import { createJobDefinition } from 'wasp/server/jobs/core/pgBoss';
const entities = {
    File: prisma.file,
};
const jobSchedule = null;
// PUBLIC API
export const processPDFMetadata = createJobDefinition({
    jobName: 'processPDFMetadata',
    defaultJobOptions: {},
    jobSchedule,
    entities,
});
//# sourceMappingURL=processPDFMetadata.js.map