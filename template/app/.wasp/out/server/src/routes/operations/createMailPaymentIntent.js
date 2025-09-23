import { createAction } from '../../middleware/operations.js'
import createMailPaymentIntent from '../../actions/createMailPaymentIntent.js'

export default createAction(createMailPaymentIntent)
