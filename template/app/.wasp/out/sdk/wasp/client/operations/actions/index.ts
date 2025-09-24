import { type ActionFor, createAction } from './core'
import { UpdateIsUserAdminById_ext } from 'wasp/server/operations/actions'
import { GenerateGptResponse_ext } from 'wasp/server/operations/actions'
import { CreateTask_ext } from 'wasp/server/operations/actions'
import { DeleteTask_ext } from 'wasp/server/operations/actions'
import { UpdateTask_ext } from 'wasp/server/operations/actions'
import { GenerateCheckoutSession_ext } from 'wasp/server/operations/actions'
import { CreateFile_ext } from 'wasp/server/operations/actions'
import { DeleteFile_ext } from 'wasp/server/operations/actions'
import { CreateMailAddress_ext } from 'wasp/server/operations/actions'
import { UpdateMailAddress_ext } from 'wasp/server/operations/actions'
import { DeleteMailAddress_ext } from 'wasp/server/operations/actions'
import { SetDefaultAddress_ext } from 'wasp/server/operations/actions'
import { CreateMailPiece_ext } from 'wasp/server/operations/actions'
import { UpdateMailPiece_ext } from 'wasp/server/operations/actions'
import { DeleteMailPiece_ext } from 'wasp/server/operations/actions'
import { UpdateMailPieceStatus_ext } from 'wasp/server/operations/actions'
import { CreateMailPaymentIntent_ext } from 'wasp/server/operations/actions'
import { CreateMailCheckoutSession_ext } from 'wasp/server/operations/actions'
import { ConfirmMailPayment_ext } from 'wasp/server/operations/actions'
import { RefundMailPayment_ext } from 'wasp/server/operations/actions'
import { SubmitMailPieceToLob_ext } from 'wasp/server/operations/actions'
import { SyncMailPieceStatus_ext } from 'wasp/server/operations/actions'
import { BulkDeleteMailPieces_ext } from 'wasp/server/operations/actions'

// PUBLIC API
export const updateIsUserAdminById: ActionFor<UpdateIsUserAdminById_ext> = createAction<UpdateIsUserAdminById_ext>(
  'operations/update-is-user-admin-by-id',
  ['User'],
)

// PUBLIC API
export const generateGptResponse: ActionFor<GenerateGptResponse_ext> = createAction<GenerateGptResponse_ext>(
  'operations/generate-gpt-response',
  ['User', 'Task', 'GptResponse'],
)

// PUBLIC API
export const createTask: ActionFor<CreateTask_ext> = createAction<CreateTask_ext>(
  'operations/create-task',
  ['Task'],
)

// PUBLIC API
export const deleteTask: ActionFor<DeleteTask_ext> = createAction<DeleteTask_ext>(
  'operations/delete-task',
  ['Task'],
)

// PUBLIC API
export const updateTask: ActionFor<UpdateTask_ext> = createAction<UpdateTask_ext>(
  'operations/update-task',
  ['Task'],
)

// PUBLIC API
export const generateCheckoutSession: ActionFor<GenerateCheckoutSession_ext> = createAction<GenerateCheckoutSession_ext>(
  'operations/generate-checkout-session',
  ['User'],
)

// PUBLIC API
export const createFile: ActionFor<CreateFile_ext> = createAction<CreateFile_ext>(
  'operations/create-file',
  ['User', 'File'],
)

// PUBLIC API
export const deleteFile: ActionFor<DeleteFile_ext> = createAction<DeleteFile_ext>(
  'operations/delete-file',
  ['User', 'File'],
)

// PUBLIC API
export const createMailAddress: ActionFor<CreateMailAddress_ext> = createAction<CreateMailAddress_ext>(
  'operations/create-mail-address',
  ['User', 'MailAddress'],
)

// PUBLIC API
export const updateMailAddress: ActionFor<UpdateMailAddress_ext> = createAction<UpdateMailAddress_ext>(
  'operations/update-mail-address',
  ['User', 'MailAddress'],
)

// PUBLIC API
export const deleteMailAddress: ActionFor<DeleteMailAddress_ext> = createAction<DeleteMailAddress_ext>(
  'operations/delete-mail-address',
  ['User', 'MailAddress'],
)

// PUBLIC API
export const setDefaultAddress: ActionFor<SetDefaultAddress_ext> = createAction<SetDefaultAddress_ext>(
  'operations/set-default-address',
  ['User', 'MailAddress'],
)

// PUBLIC API
export const createMailPiece: ActionFor<CreateMailPiece_ext> = createAction<CreateMailPiece_ext>(
  'operations/create-mail-piece',
  ['MailPiece', 'MailAddress', 'File', 'MailPieceStatusHistory'],
)

// PUBLIC API
export const updateMailPiece: ActionFor<UpdateMailPiece_ext> = createAction<UpdateMailPiece_ext>(
  'operations/update-mail-piece',
  ['MailPiece', 'MailAddress', 'File', 'MailPieceStatusHistory'],
)

// PUBLIC API
export const deleteMailPiece: ActionFor<DeleteMailPiece_ext> = createAction<DeleteMailPiece_ext>(
  'operations/delete-mail-piece',
  ['MailPiece', 'MailPieceStatusHistory'],
)

// PUBLIC API
export const updateMailPieceStatus: ActionFor<UpdateMailPieceStatus_ext> = createAction<UpdateMailPieceStatus_ext>(
  'operations/update-mail-piece-status',
  ['MailPiece', 'MailPieceStatusHistory'],
)

// PUBLIC API
export const createMailPaymentIntent: ActionFor<CreateMailPaymentIntent_ext> = createAction<CreateMailPaymentIntent_ext>(
  'operations/create-mail-payment-intent',
  ['MailPiece', 'MailAddress', 'MailPieceStatusHistory'],
)

// PUBLIC API
export const createMailCheckoutSession: ActionFor<CreateMailCheckoutSession_ext> = createAction<CreateMailCheckoutSession_ext>(
  'operations/create-mail-checkout-session',
  ['MailPiece', 'MailAddress', 'MailPieceStatusHistory'],
)

// PUBLIC API
export const confirmMailPayment: ActionFor<ConfirmMailPayment_ext> = createAction<ConfirmMailPayment_ext>(
  'operations/confirm-mail-payment',
  ['MailPiece', 'MailPieceStatusHistory'],
)

// PUBLIC API
export const refundMailPayment: ActionFor<RefundMailPayment_ext> = createAction<RefundMailPayment_ext>(
  'operations/refund-mail-payment',
  ['MailPiece', 'MailPieceStatusHistory'],
)

// PUBLIC API
export const submitMailPieceToLob: ActionFor<SubmitMailPieceToLob_ext> = createAction<SubmitMailPieceToLob_ext>(
  'operations/submit-mail-piece-to-lob',
  ['MailPiece', 'MailAddress', 'File', 'MailPieceStatusHistory'],
)

// PUBLIC API
export const syncMailPieceStatus: ActionFor<SyncMailPieceStatus_ext> = createAction<SyncMailPieceStatus_ext>(
  'operations/sync-mail-piece-status',
  ['MailPiece', 'MailPieceStatusHistory'],
)

// PUBLIC API
export const bulkDeleteMailPieces: ActionFor<BulkDeleteMailPieces_ext> = createAction<BulkDeleteMailPieces_ext>(
  'operations/bulk-delete-mail-pieces',
  ['MailPiece', 'MailPieceStatusHistory'],
)
