import type { JSONValue, JSONObject } from 'wasp/core/serialization';
import { type JobFn } from 'wasp/server/jobs/core/pgBoss';
declare const entities: {
    File: import(".prisma/client").Prisma.FileDelegate<import("@prisma/client/runtime/library.js").DefaultArgs>;
};
export type ProcessPDFMetadata<Input extends JSONObject, Output extends JSONValue | void> = JobFn<Input, Output, typeof entities>;
export declare const processPDFMetadata: import("./core/pgBoss/pgBossJob").PgBossJob<JSONObject, void | JSONValue, {
    File: import(".prisma/client").Prisma.FileDelegate<import("@prisma/client/runtime/library.js").DefaultArgs>;
}>;
export {};
//# sourceMappingURL=processPDFMetadata.d.ts.map