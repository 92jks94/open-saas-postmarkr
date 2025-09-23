import express from 'express';
import { prisma } from 'wasp/server';
import { defineHandler } from 'wasp/server/utils';
import { globalMiddlewareConfigForExpress } from '../../middleware/index.js';
import auth from 'wasp/core/auth';
import { makeAuthUserIfPossible } from 'wasp/auth/user';
import { paymentsWebhook as _wasppaymentsWebhookfn } from '../../../../../../src/payment/webhook';
import { paymentsMiddlewareConfigFn as _wasppaymentsWebhookmiddlewareConfigFn } from '../../../../../../src/payment/webhook';
import { handleLobWebhook as _wasplobWebhookfn } from '../../../../../../src/server/lob/webhook';
import { validateAddressEndpoint as _waspvalidateAddressfn } from '../../../../../../src/server/lob/addressValidation';
const idFn = x => x;
const _wasplobWebhookmiddlewareConfigFn = idFn;
const _waspvalidateAddressmiddlewareConfigFn = idFn;
const router = express.Router();
const paymentsWebhookMiddleware = globalMiddlewareConfigForExpress(_wasppaymentsWebhookmiddlewareConfigFn);
router.post('/payments-webhook', [auth, ...paymentsWebhookMiddleware], defineHandler((req, res) => {
    const context = {
        user: makeAuthUserIfPossible(req.user),
        entities: {
            User: prisma.user,
        },
    };
    return _wasppaymentsWebhookfn(req, res, context);
}));
const lobWebhookMiddleware = globalMiddlewareConfigForExpress(_wasplobWebhookmiddlewareConfigFn);
router.post('/webhooks/lob', [auth, ...lobWebhookMiddleware], defineHandler((req, res) => {
    const context = {
        user: makeAuthUserIfPossible(req.user),
        entities: {},
    };
    return _wasplobWebhookfn(req, res, context);
}));
const validateAddressMiddleware = globalMiddlewareConfigForExpress(_waspvalidateAddressmiddlewareConfigFn);
router.post('/api/validate-address', [auth, ...validateAddressMiddleware], defineHandler((req, res) => {
    const context = {
        user: makeAuthUserIfPossible(req.user),
        entities: {},
    };
    return _waspvalidateAddressfn(req, res, context);
}));
export default router;
//# sourceMappingURL=index.js.map