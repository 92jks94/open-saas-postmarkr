import { createAction } from './core';
// PUBLIC API
export const updateIsUserAdminById = createAction('operations/update-is-user-admin-by-id', ['User']);
// PUBLIC API
export const generateGptResponse = createAction('operations/generate-gpt-response', ['User', 'Task', 'GptResponse']);
// PUBLIC API
export const createTask = createAction('operations/create-task', ['Task']);
// PUBLIC API
export const deleteTask = createAction('operations/delete-task', ['Task']);
// PUBLIC API
export const updateTask = createAction('operations/update-task', ['Task']);
// PUBLIC API
export const generateCheckoutSession = createAction('operations/generate-checkout-session', ['User']);
// PUBLIC API
export const createFile = createAction('operations/create-file', ['User', 'File']);
// PUBLIC API
export const deleteFile = createAction('operations/delete-file', ['User', 'File']);
// PUBLIC API
export const createMailAddress = createAction('operations/create-mail-address', ['User', 'MailAddress']);
// PUBLIC API
export const updateMailAddress = createAction('operations/update-mail-address', ['User', 'MailAddress']);
// PUBLIC API
export const deleteMailAddress = createAction('operations/delete-mail-address', ['User', 'MailAddress']);
// PUBLIC API
export const setDefaultAddress = createAction('operations/set-default-address', ['User', 'MailAddress']);
// PUBLIC API
export const createMailPiece = createAction('operations/create-mail-piece', ['MailPiece', 'MailAddress', 'File', 'MailPieceStatusHistory']);
// PUBLIC API
export const updateMailPiece = createAction('operations/update-mail-piece', ['MailPiece', 'MailAddress', 'File', 'MailPieceStatusHistory']);
// PUBLIC API
export const deleteMailPiece = createAction('operations/delete-mail-piece', ['MailPiece', 'MailPieceStatusHistory']);
// PUBLIC API
export const updateMailPieceStatus = createAction('operations/update-mail-piece-status', ['MailPiece', 'MailPieceStatusHistory']);
// PUBLIC API
export const createMailPaymentIntent = createAction('operations/create-mail-payment-intent', ['MailPiece', 'MailAddress', 'MailPieceStatusHistory']);
// PUBLIC API
export const createMailCheckoutSession = createAction('operations/create-mail-checkout-session', ['MailPiece', 'MailAddress', 'MailPieceStatusHistory']);
// PUBLIC API
export const confirmMailPayment = createAction('operations/confirm-mail-payment', ['MailPiece', 'MailPieceStatusHistory']);
// PUBLIC API
export const refundMailPayment = createAction('operations/refund-mail-payment', ['MailPiece', 'MailPieceStatusHistory']);
// PUBLIC API
export const submitMailPieceToLob = createAction('operations/submit-mail-piece-to-lob', ['MailPiece', 'MailAddress', 'File', 'MailPieceStatusHistory']);
// PUBLIC API
export const syncMailPieceStatus = createAction('operations/sync-mail-piece-status', ['MailPiece', 'MailPieceStatusHistory']);
// PUBLIC API
export const bulkDeleteMailPieces = createAction('operations/bulk-delete-mail-pieces', ['MailPiece', 'MailPieceStatusHistory']);
//# sourceMappingURL=index.js.map