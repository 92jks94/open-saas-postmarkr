import { prisma } from 'wasp/server';
import { createAuthenticatedOperation, } from '../wrappers.js';
import { getPaginatedUsers as getPaginatedUsers_ext } from 'wasp/src/user/operations';
import { getGptResponses as getGptResponses_ext } from 'wasp/src/demo-ai-app/operations';
import { getAllTasksByUser as getAllTasksByUser_ext } from 'wasp/src/demo-ai-app/operations';
import { getCustomerPortalUrl as getCustomerPortalUrl_ext } from 'wasp/src/payment/operations';
import { getAllFilesByUser as getAllFilesByUser_ext } from 'wasp/src/file-upload/operations';
import { getDownloadFileSignedURL as getDownloadFileSignedURL_ext } from 'wasp/src/file-upload/operations';
import { getMailAddressesByUser as getMailAddressesByUser_ext } from 'wasp/src/address-management/operations';
import { getDailyStats as getDailyStats_ext } from 'wasp/src/analytics/operations';
import { getMailPieces as getMailPieces_ext } from 'wasp/src/mail/operations';
import { getMailPiece as getMailPiece_ext } from 'wasp/src/mail/operations';
// PUBLIC API
export const getPaginatedUsers = createAuthenticatedOperation(getPaginatedUsers_ext, {
    User: prisma.user,
});
// PUBLIC API
export const getGptResponses = createAuthenticatedOperation(getGptResponses_ext, {
    User: prisma.user,
    GptResponse: prisma.gptResponse,
});
// PUBLIC API
export const getAllTasksByUser = createAuthenticatedOperation(getAllTasksByUser_ext, {
    Task: prisma.task,
});
// PUBLIC API
export const getCustomerPortalUrl = createAuthenticatedOperation(getCustomerPortalUrl_ext, {
    User: prisma.user,
});
// PUBLIC API
export const getAllFilesByUser = createAuthenticatedOperation(getAllFilesByUser_ext, {
    User: prisma.user,
    File: prisma.file,
});
// PUBLIC API
export const getDownloadFileSignedURL = createAuthenticatedOperation(getDownloadFileSignedURL_ext, {
    User: prisma.user,
    File: prisma.file,
});
// PUBLIC API
export const getMailAddressesByUser = createAuthenticatedOperation(getMailAddressesByUser_ext, {
    User: prisma.user,
    MailAddress: prisma.mailAddress,
});
// PUBLIC API
export const getDailyStats = createAuthenticatedOperation(getDailyStats_ext, {
    User: prisma.user,
    DailyStats: prisma.dailyStats,
});
// PUBLIC API
export const getMailPieces = createAuthenticatedOperation(getMailPieces_ext, {
    MailPiece: prisma.mailPiece,
    MailAddress: prisma.mailAddress,
    File: prisma.file,
    MailPieceStatusHistory: prisma.mailPieceStatusHistory,
});
// PUBLIC API
export const getMailPiece = createAuthenticatedOperation(getMailPiece_ext, {
    MailPiece: prisma.mailPiece,
    MailAddress: prisma.mailAddress,
    File: prisma.file,
    MailPieceStatusHistory: prisma.mailPieceStatusHistory,
});
//# sourceMappingURL=index.js.map