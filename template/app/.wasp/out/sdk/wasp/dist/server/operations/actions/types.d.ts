import { type _User, type _Task, type _GptResponse, type _File, type _MailAddress, type _MailPiece, type _MailPieceStatusHistory, type AuthenticatedActionDefinition, type Payload } from 'wasp/server/_types';
export type UpdateIsUserAdminById<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _User
], Input, Output>;
export type GenerateGptResponse<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _User,
    _Task,
    _GptResponse
], Input, Output>;
export type CreateTask<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _Task
], Input, Output>;
export type DeleteTask<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _Task
], Input, Output>;
export type UpdateTask<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _Task
], Input, Output>;
export type GenerateCheckoutSession<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _User
], Input, Output>;
export type CreateFile<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _User,
    _File
], Input, Output>;
export type DeleteFile<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _User,
    _File
], Input, Output>;
export type CreateMailAddress<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _User,
    _MailAddress
], Input, Output>;
export type UpdateMailAddress<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _User,
    _MailAddress
], Input, Output>;
export type DeleteMailAddress<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _User,
    _MailAddress
], Input, Output>;
export type SetDefaultAddress<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _User,
    _MailAddress
], Input, Output>;
export type CreateMailPiece<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _MailPiece,
    _MailAddress,
    _File,
    _MailPieceStatusHistory
], Input, Output>;
export type UpdateMailPiece<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _MailPiece,
    _MailAddress,
    _File,
    _MailPieceStatusHistory
], Input, Output>;
export type DeleteMailPiece<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _MailPiece,
    _MailPieceStatusHistory
], Input, Output>;
export type UpdateMailPieceStatus<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _MailPiece,
    _MailPieceStatusHistory
], Input, Output>;
export type CreateMailPaymentIntent<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _MailPiece,
    _MailAddress,
    _MailPieceStatusHistory
], Input, Output>;
export type ConfirmMailPayment<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _MailPiece,
    _MailPieceStatusHistory
], Input, Output>;
export type RefundMailPayment<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _MailPiece,
    _MailPieceStatusHistory
], Input, Output>;
export type SubmitMailPieceToLob<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _MailPiece,
    _MailAddress,
    _File,
    _MailPieceStatusHistory
], Input, Output>;
export type SyncMailPieceStatus<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _MailPiece,
    _MailPieceStatusHistory
], Input, Output>;
//# sourceMappingURL=types.d.ts.map