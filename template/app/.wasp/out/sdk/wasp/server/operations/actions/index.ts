
import { prisma } from 'wasp/server'
import {
  type UnauthenticatedOperationFor,
  createUnauthenticatedOperation,
  type AuthenticatedOperationFor,
  createAuthenticatedOperation,
} from '../wrappers.js'
import { updateIsUserAdminById as updateIsUserAdminById_ext } from 'wasp/src/user/operations'
import { generateGptResponse as generateGptResponse_ext } from 'wasp/src/demo-ai-app/operations'
import { createTask as createTask_ext } from 'wasp/src/demo-ai-app/operations'
import { deleteTask as deleteTask_ext } from 'wasp/src/demo-ai-app/operations'
import { updateTask as updateTask_ext } from 'wasp/src/demo-ai-app/operations'
import { generateCheckoutSession as generateCheckoutSession_ext } from 'wasp/src/payment/operations'
import { createFile as createFile_ext } from 'wasp/src/file-upload/operations'
import { deleteFile as deleteFile_ext } from 'wasp/src/file-upload/operations'
import { createMailAddress as createMailAddress_ext } from 'wasp/src/address-management/operations'
import { updateMailAddress as updateMailAddress_ext } from 'wasp/src/address-management/operations'
import { deleteMailAddress as deleteMailAddress_ext } from 'wasp/src/address-management/operations'
import { setDefaultAddress as setDefaultAddress_ext } from 'wasp/src/address-management/operations'
import { createMailPiece as createMailPiece_ext } from 'wasp/src/mail/operations'
import { updateMailPiece as updateMailPiece_ext } from 'wasp/src/mail/operations'
import { deleteMailPiece as deleteMailPiece_ext } from 'wasp/src/mail/operations'
import { updateMailPieceStatus as updateMailPieceStatus_ext } from 'wasp/src/mail/operations'
import { createMailPaymentIntent as createMailPaymentIntent_ext } from 'wasp/src/mail/operations'
import { createMailCheckoutSession as createMailCheckoutSession_ext } from 'wasp/src/mail/operations'
import { confirmMailPayment as confirmMailPayment_ext } from 'wasp/src/mail/operations'
import { refundMailPayment as refundMailPayment_ext } from 'wasp/src/mail/operations'
import { submitMailPieceToLob as submitMailPieceToLob_ext } from 'wasp/src/mail/operations'
import { syncMailPieceStatus as syncMailPieceStatus_ext } from 'wasp/src/mail/operations'
import { bulkDeleteMailPieces as bulkDeleteMailPieces_ext } from 'wasp/src/mail/operations'

// PRIVATE API
export type UpdateIsUserAdminById_ext = typeof updateIsUserAdminById_ext

// PUBLIC API
export const updateIsUserAdminById: AuthenticatedOperationFor<UpdateIsUserAdminById_ext> =
  createAuthenticatedOperation(
    updateIsUserAdminById_ext,
    {
      User: prisma.user,
    },
  )

// PRIVATE API
export type GenerateGptResponse_ext = typeof generateGptResponse_ext

// PUBLIC API
export const generateGptResponse: AuthenticatedOperationFor<GenerateGptResponse_ext> =
  createAuthenticatedOperation(
    generateGptResponse_ext,
    {
      User: prisma.user,
      Task: prisma.task,
      GptResponse: prisma.gptResponse,
    },
  )

// PRIVATE API
export type CreateTask_ext = typeof createTask_ext

// PUBLIC API
export const createTask: AuthenticatedOperationFor<CreateTask_ext> =
  createAuthenticatedOperation(
    createTask_ext,
    {
      Task: prisma.task,
    },
  )

// PRIVATE API
export type DeleteTask_ext = typeof deleteTask_ext

// PUBLIC API
export const deleteTask: AuthenticatedOperationFor<DeleteTask_ext> =
  createAuthenticatedOperation(
    deleteTask_ext,
    {
      Task: prisma.task,
    },
  )

// PRIVATE API
export type UpdateTask_ext = typeof updateTask_ext

// PUBLIC API
export const updateTask: AuthenticatedOperationFor<UpdateTask_ext> =
  createAuthenticatedOperation(
    updateTask_ext,
    {
      Task: prisma.task,
    },
  )

// PRIVATE API
export type GenerateCheckoutSession_ext = typeof generateCheckoutSession_ext

// PUBLIC API
export const generateCheckoutSession: AuthenticatedOperationFor<GenerateCheckoutSession_ext> =
  createAuthenticatedOperation(
    generateCheckoutSession_ext,
    {
      User: prisma.user,
    },
  )

// PRIVATE API
export type CreateFile_ext = typeof createFile_ext

// PUBLIC API
export const createFile: AuthenticatedOperationFor<CreateFile_ext> =
  createAuthenticatedOperation(
    createFile_ext,
    {
      User: prisma.user,
      File: prisma.file,
    },
  )

// PRIVATE API
export type DeleteFile_ext = typeof deleteFile_ext

// PUBLIC API
export const deleteFile: AuthenticatedOperationFor<DeleteFile_ext> =
  createAuthenticatedOperation(
    deleteFile_ext,
    {
      User: prisma.user,
      File: prisma.file,
    },
  )

// PRIVATE API
export type CreateMailAddress_ext = typeof createMailAddress_ext

// PUBLIC API
export const createMailAddress: AuthenticatedOperationFor<CreateMailAddress_ext> =
  createAuthenticatedOperation(
    createMailAddress_ext,
    {
      User: prisma.user,
      MailAddress: prisma.mailAddress,
    },
  )

// PRIVATE API
export type UpdateMailAddress_ext = typeof updateMailAddress_ext

// PUBLIC API
export const updateMailAddress: AuthenticatedOperationFor<UpdateMailAddress_ext> =
  createAuthenticatedOperation(
    updateMailAddress_ext,
    {
      User: prisma.user,
      MailAddress: prisma.mailAddress,
    },
  )

// PRIVATE API
export type DeleteMailAddress_ext = typeof deleteMailAddress_ext

// PUBLIC API
export const deleteMailAddress: AuthenticatedOperationFor<DeleteMailAddress_ext> =
  createAuthenticatedOperation(
    deleteMailAddress_ext,
    {
      User: prisma.user,
      MailAddress: prisma.mailAddress,
    },
  )

// PRIVATE API
export type SetDefaultAddress_ext = typeof setDefaultAddress_ext

// PUBLIC API
export const setDefaultAddress: AuthenticatedOperationFor<SetDefaultAddress_ext> =
  createAuthenticatedOperation(
    setDefaultAddress_ext,
    {
      User: prisma.user,
      MailAddress: prisma.mailAddress,
    },
  )

// PRIVATE API
export type CreateMailPiece_ext = typeof createMailPiece_ext

// PUBLIC API
export const createMailPiece: AuthenticatedOperationFor<CreateMailPiece_ext> =
  createAuthenticatedOperation(
    createMailPiece_ext,
    {
      MailPiece: prisma.mailPiece,
      MailAddress: prisma.mailAddress,
      File: prisma.file,
      MailPieceStatusHistory: prisma.mailPieceStatusHistory,
    },
  )

// PRIVATE API
export type UpdateMailPiece_ext = typeof updateMailPiece_ext

// PUBLIC API
export const updateMailPiece: AuthenticatedOperationFor<UpdateMailPiece_ext> =
  createAuthenticatedOperation(
    updateMailPiece_ext,
    {
      MailPiece: prisma.mailPiece,
      MailAddress: prisma.mailAddress,
      File: prisma.file,
      MailPieceStatusHistory: prisma.mailPieceStatusHistory,
    },
  )

// PRIVATE API
export type DeleteMailPiece_ext = typeof deleteMailPiece_ext

// PUBLIC API
export const deleteMailPiece: AuthenticatedOperationFor<DeleteMailPiece_ext> =
  createAuthenticatedOperation(
    deleteMailPiece_ext,
    {
      MailPiece: prisma.mailPiece,
      MailPieceStatusHistory: prisma.mailPieceStatusHistory,
    },
  )

// PRIVATE API
export type UpdateMailPieceStatus_ext = typeof updateMailPieceStatus_ext

// PUBLIC API
export const updateMailPieceStatus: AuthenticatedOperationFor<UpdateMailPieceStatus_ext> =
  createAuthenticatedOperation(
    updateMailPieceStatus_ext,
    {
      MailPiece: prisma.mailPiece,
      MailPieceStatusHistory: prisma.mailPieceStatusHistory,
    },
  )

// PRIVATE API
export type CreateMailPaymentIntent_ext = typeof createMailPaymentIntent_ext

// PUBLIC API
export const createMailPaymentIntent: AuthenticatedOperationFor<CreateMailPaymentIntent_ext> =
  createAuthenticatedOperation(
    createMailPaymentIntent_ext,
    {
      MailPiece: prisma.mailPiece,
      MailAddress: prisma.mailAddress,
      MailPieceStatusHistory: prisma.mailPieceStatusHistory,
    },
  )

// PRIVATE API
export type CreateMailCheckoutSession_ext = typeof createMailCheckoutSession_ext

// PUBLIC API
export const createMailCheckoutSession: AuthenticatedOperationFor<CreateMailCheckoutSession_ext> =
  createAuthenticatedOperation(
    createMailCheckoutSession_ext,
    {
      MailPiece: prisma.mailPiece,
      MailAddress: prisma.mailAddress,
      MailPieceStatusHistory: prisma.mailPieceStatusHistory,
    },
  )

// PRIVATE API
export type ConfirmMailPayment_ext = typeof confirmMailPayment_ext

// PUBLIC API
export const confirmMailPayment: AuthenticatedOperationFor<ConfirmMailPayment_ext> =
  createAuthenticatedOperation(
    confirmMailPayment_ext,
    {
      MailPiece: prisma.mailPiece,
      MailPieceStatusHistory: prisma.mailPieceStatusHistory,
    },
  )

// PRIVATE API
export type RefundMailPayment_ext = typeof refundMailPayment_ext

// PUBLIC API
export const refundMailPayment: AuthenticatedOperationFor<RefundMailPayment_ext> =
  createAuthenticatedOperation(
    refundMailPayment_ext,
    {
      MailPiece: prisma.mailPiece,
      MailPieceStatusHistory: prisma.mailPieceStatusHistory,
    },
  )

// PRIVATE API
export type SubmitMailPieceToLob_ext = typeof submitMailPieceToLob_ext

// PUBLIC API
export const submitMailPieceToLob: AuthenticatedOperationFor<SubmitMailPieceToLob_ext> =
  createAuthenticatedOperation(
    submitMailPieceToLob_ext,
    {
      MailPiece: prisma.mailPiece,
      MailAddress: prisma.mailAddress,
      File: prisma.file,
      MailPieceStatusHistory: prisma.mailPieceStatusHistory,
    },
  )

// PRIVATE API
export type SyncMailPieceStatus_ext = typeof syncMailPieceStatus_ext

// PUBLIC API
export const syncMailPieceStatus: AuthenticatedOperationFor<SyncMailPieceStatus_ext> =
  createAuthenticatedOperation(
    syncMailPieceStatus_ext,
    {
      MailPiece: prisma.mailPiece,
      MailPieceStatusHistory: prisma.mailPieceStatusHistory,
    },
  )

// PRIVATE API
export type BulkDeleteMailPieces_ext = typeof bulkDeleteMailPieces_ext

// PUBLIC API
export const bulkDeleteMailPieces: AuthenticatedOperationFor<BulkDeleteMailPieces_ext> =
  createAuthenticatedOperation(
    bulkDeleteMailPieces_ext,
    {
      MailPiece: prisma.mailPiece,
      MailPieceStatusHistory: prisma.mailPieceStatusHistory,
    },
  )
