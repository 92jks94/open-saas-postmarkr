import express from 'express'
import { prisma } from 'wasp/server'
import { defineHandler } from 'wasp/server/utils'
import { MiddlewareConfigFn, globalMiddlewareConfigForExpress } from '../../middleware/index.js'
import auth from 'wasp/core/auth'
import { type AuthUserData, makeAuthUserIfPossible } from 'wasp/auth/user'


import { paymentsWebhook as _wasppaymentsWebhookfn } from '../../../../../../src/payment/webhook'
import { paymentsMiddlewareConfigFn as _wasppaymentsWebhookmiddlewareConfigFn } from '../../../../../../src/payment/webhook'
import { lobWebhook as _wasplobWebhookfn } from '../../../../../../src/server/lob/webhook'
import { lobMiddlewareConfigFn as _wasplobWebhookmiddlewareConfigFn } from '../../../../../../src/server/lob/webhook'
import { validateAddressEndpoint as _waspvalidateAddressfn } from '../../../../../../src/server/lob/addressValidation'
import { healthCheckEndpoint as _wasphealthCheckfn } from '../../../../../../src/server/healthCheck'

const idFn: MiddlewareConfigFn = x => x

const _waspvalidateAddressmiddlewareConfigFn = idFn
const _wasphealthCheckmiddlewareConfigFn = idFn

const router = express.Router()


const paymentsWebhookMiddleware = globalMiddlewareConfigForExpress(_wasppaymentsWebhookmiddlewareConfigFn)
router.post(
  '/payments-webhook',
  [auth, ...paymentsWebhookMiddleware],
  defineHandler(
    (
      req: Parameters<typeof _wasppaymentsWebhookfn>[0] & { user: AuthUserData | null },
      res: Parameters<typeof _wasppaymentsWebhookfn>[1],
    ) => {
      const context = {
        user: makeAuthUserIfPossible(req.user),
        entities: {
          User: prisma.user,
        },
      }
      return _wasppaymentsWebhookfn(req, res, context)
    }
  )
)
const lobWebhookMiddleware = globalMiddlewareConfigForExpress(_wasplobWebhookmiddlewareConfigFn)
router.post(
  '/webhooks/lob',
  [auth, ...lobWebhookMiddleware],
  defineHandler(
    (
      req: Parameters<typeof _wasplobWebhookfn>[0] & { user: AuthUserData | null },
      res: Parameters<typeof _wasplobWebhookfn>[1],
    ) => {
      const context = {
        user: makeAuthUserIfPossible(req.user),
        entities: {
        },
      }
      return _wasplobWebhookfn(req, res, context)
    }
  )
)
const validateAddressMiddleware = globalMiddlewareConfigForExpress(_waspvalidateAddressmiddlewareConfigFn)
router.post(
  '/api/validate-address',
  [auth, ...validateAddressMiddleware],
  defineHandler(
    (
      req: Parameters<typeof _waspvalidateAddressfn>[0] & { user: AuthUserData | null },
      res: Parameters<typeof _waspvalidateAddressfn>[1],
    ) => {
      const context = {
        user: makeAuthUserIfPossible(req.user),
        entities: {
        },
      }
      return _waspvalidateAddressfn(req, res, context)
    }
  )
)
const healthCheckMiddleware = globalMiddlewareConfigForExpress(_wasphealthCheckmiddlewareConfigFn)
router.get(
  '/health',
  [auth, ...healthCheckMiddleware],
  defineHandler(
    (
      req: Parameters<typeof _wasphealthCheckfn>[0] & { user: AuthUserData | null },
      res: Parameters<typeof _wasphealthCheckfn>[1],
    ) => {
      const context = {
        user: makeAuthUserIfPossible(req.user),
        entities: {
        },
      }
      return _wasphealthCheckfn(req, res, context)
    }
  )
)

export default router
