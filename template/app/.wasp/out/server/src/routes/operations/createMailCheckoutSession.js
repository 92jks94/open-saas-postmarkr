import { createAction } from '../../middleware/operations.js'
import createMailCheckoutSession from '../../actions/createMailCheckoutSession.js'

export default createAction(createMailCheckoutSession)
