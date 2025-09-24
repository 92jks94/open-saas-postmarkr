import { prisma } from 'wasp/server';
import { createAuthenticatedOperation, } from '../wrappers.js';
import { updateIsUserAdminById as updateIsUserAdminById_ext } from 'wasp/src/user/operations';
import { generateGptResponse as generateGptResponse_ext } from 'wasp/src/demo-ai-app/operations';
import { createTask as createTask_ext } from 'wasp/src/demo-ai-app/operations';
import { deleteTask as deleteTask_ext } from 'wasp/src/demo-ai-app/operations';
import { updateTask as updateTask_ext } from 'wasp/src/demo-ai-app/operations';
import { generateCheckoutSession as generateCheckoutSession_ext } from 'wasp/src/payment/operations';
import { createFile as createFile_ext } from 'wasp/src/file-upload/operations';
import { deleteFile as deleteFile_ext } from 'wasp/src/file-upload/operations';
import { createMailAddress as createMailAddress_ext } from 'wasp/src/address-management/operations';
import { updateMailAddress as updateMailAddress_ext } from 'wasp/src/address-management/operations';
import { deleteMailAddress as deleteMailAddress_ext } from 'wasp/src/address-management/operations';
import { setDefaultAddress as setDefaultAddress_ext } from 'wasp/src/address-management/operations';
import { createMailPiece as createMailPiece_ext } from 'wasp/src/mail/operations';
import { updateMailPiece as updateMailPiece_ext } from 'wasp/src/mail/operations';
import { deleteMailPiece as deleteMailPiece_ext } from 'wasp/src/mail/operations';
import { updateMailPieceStatus as updateMailPieceStatus_ext } from 'wasp/src/mail/operations';
import { createMailPaymentIntent as createMailPaymentIntent_ext } from 'wasp/src/mail/operations';
import { createMailCheckoutSession as createMailCheckoutSession_ext } from 'wasp/src/mail/operations';
import { confirmMailPayment as confirmMailPayment_ext } from 'wasp/src/mail/operations';
import { refundMailPayment as refundMailPayment_ext } from 'wasp/src/mail/operations';
import { submitMailPieceToLob as submitMailPieceToLob_ext } from 'wasp/src/mail/operations';
import { syncMailPieceStatus as syncMailPieceStatus_ext } from 'wasp/src/mail/operations';
import { bulkDeleteMailPieces as bulkDeleteMailPieces_ext } from 'wasp/src/mail/operations';
// PUBLIC API
export const updateIsUserAdminById = createAuthenticatedOperation(updateIsUserAdminById_ext, {
    User: prisma.user,
});
// PUBLIC API
export const generateGptResponse = createAuthenticatedOperation(generateGptResponse_ext, {
    User: prisma.user,
    Task: prisma.task,
    GptResponse: prisma.gptResponse,
});
// PUBLIC API
export const createTask = createAuthenticatedOperation(createTask_ext, {
    Task: prisma.task,
});
// PUBLIC API
export const deleteTask = createAuthenticatedOperation(deleteTask_ext, {
    Task: prisma.task,
});
// PUBLIC API
export const updateTask = createAuthenticatedOperation(updateTask_ext, {
    Task: prisma.task,
});
// PUBLIC API
export const generateCheckoutSession = createAuthenticatedOperation(generateCheckoutSession_ext, {
    User: prisma.user,
});
// PUBLIC API
export const createFile = createAuthenticatedOperation(createFile_ext, {
    User: prisma.user,
    File: prisma.file,
});
// PUBLIC API
export const deleteFile = createAuthenticatedOperation(deleteFile_ext, {
    User: prisma.user,
    File: prisma.file,
});
// PUBLIC API
export const createMailAddress = createAuthenticatedOperation(createMailAddress_ext, {
    User: prisma.user,
    MailAddress: prisma.mailAddress,
});
// PUBLIC API
export const updateMailAddress = createAuthenticatedOperation(updateMailAddress_ext, {
    User: prisma.user,
    MailAddress: prisma.mailAddress,
});
// PUBLIC API
export const deleteMailAddress = createAuthenticatedOperation(deleteMailAddress_ext, {
    User: prisma.user,
    MailAddress: prisma.mailAddress,
});
// PUBLIC API
export const setDefaultAddress = createAuthenticatedOperation(setDefaultAddress_ext, {
    User: prisma.user,
    MailAddress: prisma.mailAddress,
});
// PUBLIC API
export const createMailPiece = createAuthenticatedOperation(createMailPiece_ext, {
    MailPiece: prisma.mailPiece,
    MailAddress: prisma.mailAddress,
    File: prisma.file,
    MailPieceStatusHistory: prisma.mailPieceStatusHistory,
});
// PUBLIC API
export const updateMailPiece = createAuthenticatedOperation(updateMailPiece_ext, {
    MailPiece: prisma.mailPiece,
    MailAddress: prisma.mailAddress,
    File: prisma.file,
    MailPieceStatusHistory: prisma.mailPieceStatusHistory,
});
// PUBLIC API
export const deleteMailPiece = createAuthenticatedOperation(deleteMailPiece_ext, {
    MailPiece: prisma.mailPiece,
    MailPieceStatusHistory: prisma.mailPieceStatusHistory,
});
// PUBLIC API
export const updateMailPieceStatus = createAuthenticatedOperation(updateMailPieceStatus_ext, {
    MailPiece: prisma.mailPiece,
    MailPieceStatusHistory: prisma.mailPieceStatusHistory,
});
// PUBLIC API
export const createMailPaymentIntent = createAuthenticatedOperation(createMailPaymentIntent_ext, {
    MailPiece: prisma.mailPiece,
    MailAddress: prisma.mailAddress,
    MailPieceStatusHistory: prisma.mailPieceStatusHistory,
});
// PUBLIC API
export const createMailCheckoutSession = createAuthenticatedOperation(createMailCheckoutSession_ext, {
    MailPiece: prisma.mailPiece,
    MailAddress: prisma.mailAddress,
    MailPieceStatusHistory: prisma.mailPieceStatusHistory,
});
// PUBLIC API
export const confirmMailPayment = createAuthenticatedOperation(confirmMailPayment_ext, {
    MailPiece: prisma.mailPiece,
    MailPieceStatusHistory: prisma.mailPieceStatusHistory,
});
// PUBLIC API
export const refundMailPayment = createAuthenticatedOperation(refundMailPayment_ext, {
    MailPiece: prisma.mailPiece,
    MailPieceStatusHistory: prisma.mailPieceStatusHistory,
});
// PUBLIC API
export const submitMailPieceToLob = createAuthenticatedOperation(submitMailPieceToLob_ext, {
    MailPiece: prisma.mailPiece,
    MailAddress: prisma.mailAddress,
    File: prisma.file,
    MailPieceStatusHistory: prisma.mailPieceStatusHistory,
});
// PUBLIC API
export const syncMailPieceStatus = createAuthenticatedOperation(syncMailPieceStatus_ext, {
    MailPiece: prisma.mailPiece,
    MailPieceStatusHistory: prisma.mailPieceStatusHistory,
});
// PUBLIC API
export const bulkDeleteMailPieces = createAuthenticatedOperation(bulkDeleteMailPieces_ext, {
    MailPiece: prisma.mailPiece,
    MailPieceStatusHistory: prisma.mailPieceStatusHistory,
});
//# sourceMappingURL=index.js.map