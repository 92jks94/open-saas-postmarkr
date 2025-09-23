import {
  type _User,
  type _Task,
  type _GptResponse,
  type _File,
  type _MailAddress,
  type _MailPiece,
  type _MailPieceStatusHistory,
  type AuthenticatedActionDefinition,
  type Payload,
} from 'wasp/server/_types'

// PUBLIC API
export type UpdateIsUserAdminById<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GenerateGptResponse<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _Task,
      _GptResponse,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CreateTask<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Task,
    ],
    Input,
    Output
  >

// PUBLIC API
export type DeleteTask<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Task,
    ],
    Input,
    Output
  >

// PUBLIC API
export type UpdateTask<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Task,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GenerateCheckoutSession<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CreateFile<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _File,
    ],
    Input,
    Output
  >

// PUBLIC API
export type DeleteFile<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _File,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CreateMailAddress<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _MailAddress,
    ],
    Input,
    Output
  >

// PUBLIC API
export type UpdateMailAddress<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _MailAddress,
    ],
    Input,
    Output
  >

// PUBLIC API
export type DeleteMailAddress<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _MailAddress,
    ],
    Input,
    Output
  >

// PUBLIC API
export type SetDefaultAddress<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _MailAddress,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CreateMailPiece<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _MailPiece,
      _MailAddress,
      _File,
      _MailPieceStatusHistory,
    ],
    Input,
    Output
  >

// PUBLIC API
export type UpdateMailPiece<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _MailPiece,
      _MailAddress,
      _File,
      _MailPieceStatusHistory,
    ],
    Input,
    Output
  >

// PUBLIC API
export type DeleteMailPiece<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _MailPiece,
      _MailPieceStatusHistory,
    ],
    Input,
    Output
  >

// PUBLIC API
export type UpdateMailPieceStatus<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _MailPiece,
      _MailPieceStatusHistory,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CreateMailPaymentIntent<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _MailPiece,
      _MailAddress,
      _MailPieceStatusHistory,
    ],
    Input,
    Output
  >

// PUBLIC API
export type ConfirmMailPayment<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _MailPiece,
      _MailPieceStatusHistory,
    ],
    Input,
    Output
  >

// PUBLIC API
export type RefundMailPayment<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _MailPiece,
      _MailPieceStatusHistory,
    ],
    Input,
    Output
  >

// PUBLIC API
export type SubmitMailPieceToLob<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _MailPiece,
      _MailAddress,
      _File,
      _MailPieceStatusHistory,
    ],
    Input,
    Output
  >

// PUBLIC API
export type SyncMailPieceStatus<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _MailPiece,
      _MailPieceStatusHistory,
    ],
    Input,
    Output
  >

