import { registerJob } from 'wasp/server/jobs/core/pgBoss'
import { processPDFMetadata } from '../../../../../src/file-upload/operations'
import { processPDFMetadata as _waspJobDefinition } from 'wasp/server/jobs'

registerJob({
  job: _waspJobDefinition,
  jobFn: processPDFMetadata,
})
