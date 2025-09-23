import express from 'express'

import auth from 'wasp/core/auth'

import updateIsUserAdminById from './updateIsUserAdminById.js'
import generateGptResponse from './generateGptResponse.js'
import createTask from './createTask.js'
import deleteTask from './deleteTask.js'
import updateTask from './updateTask.js'
import generateCheckoutSession from './generateCheckoutSession.js'
import createFile from './createFile.js'
import deleteFile from './deleteFile.js'
import createMailAddress from './createMailAddress.js'
import updateMailAddress from './updateMailAddress.js'
import deleteMailAddress from './deleteMailAddress.js'
import setDefaultAddress from './setDefaultAddress.js'
import createMailPiece from './createMailPiece.js'
import updateMailPiece from './updateMailPiece.js'
import deleteMailPiece from './deleteMailPiece.js'
import updateMailPieceStatus from './updateMailPieceStatus.js'
import createMailPaymentIntent from './createMailPaymentIntent.js'
import confirmMailPayment from './confirmMailPayment.js'
import refundMailPayment from './refundMailPayment.js'
import submitMailPieceToLob from './submitMailPieceToLob.js'
import syncMailPieceStatus from './syncMailPieceStatus.js'
import getPaginatedUsers from './getPaginatedUsers.js'
import getGptResponses from './getGptResponses.js'
import getAllTasksByUser from './getAllTasksByUser.js'
import getCustomerPortalUrl from './getCustomerPortalUrl.js'
import getAllFilesByUser from './getAllFilesByUser.js'
import getDownloadFileSignedURL from './getDownloadFileSignedURL.js'
import getMailAddressesByUser from './getMailAddressesByUser.js'
import getDailyStats from './getDailyStats.js'
import getMailPieces from './getMailPieces.js'
import getMailPiece from './getMailPiece.js'

const router = express.Router()

router.post('/update-is-user-admin-by-id', auth, updateIsUserAdminById)
router.post('/generate-gpt-response', auth, generateGptResponse)
router.post('/create-task', auth, createTask)
router.post('/delete-task', auth, deleteTask)
router.post('/update-task', auth, updateTask)
router.post('/generate-checkout-session', auth, generateCheckoutSession)
router.post('/create-file', auth, createFile)
router.post('/delete-file', auth, deleteFile)
router.post('/create-mail-address', auth, createMailAddress)
router.post('/update-mail-address', auth, updateMailAddress)
router.post('/delete-mail-address', auth, deleteMailAddress)
router.post('/set-default-address', auth, setDefaultAddress)
router.post('/create-mail-piece', auth, createMailPiece)
router.post('/update-mail-piece', auth, updateMailPiece)
router.post('/delete-mail-piece', auth, deleteMailPiece)
router.post('/update-mail-piece-status', auth, updateMailPieceStatus)
router.post('/create-mail-payment-intent', auth, createMailPaymentIntent)
router.post('/confirm-mail-payment', auth, confirmMailPayment)
router.post('/refund-mail-payment', auth, refundMailPayment)
router.post('/submit-mail-piece-to-lob', auth, submitMailPieceToLob)
router.post('/sync-mail-piece-status', auth, syncMailPieceStatus)
router.post('/get-paginated-users', auth, getPaginatedUsers)
router.post('/get-gpt-responses', auth, getGptResponses)
router.post('/get-all-tasks-by-user', auth, getAllTasksByUser)
router.post('/get-customer-portal-url', auth, getCustomerPortalUrl)
router.post('/get-all-files-by-user', auth, getAllFilesByUser)
router.post('/get-download-file-signed-url', auth, getDownloadFileSignedURL)
router.post('/get-mail-addresses-by-user', auth, getMailAddressesByUser)
router.post('/get-daily-stats', auth, getDailyStats)
router.post('/get-mail-pieces', auth, getMailPieces)
router.post('/get-mail-piece', auth, getMailPiece)

export default router
