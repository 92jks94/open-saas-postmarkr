
import {
  type _User,
  type _GptResponse,
  type _Task,
  type _File,
  type _MailAddress,
  type _DailyStats,
  type _MailPiece,
  type _MailPieceStatusHistory,
  type AuthenticatedQueryDefinition,
  type Payload,
} from 'wasp/server/_types'

// PUBLIC API
export type GetPaginatedUsers<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetGptResponses<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _GptResponse,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetAllTasksByUser<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Task,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetCustomerPortalUrl<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetAllFilesByUser<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _File,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetDownloadFileSignedURL<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _File,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetMailAddressesByUser<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _MailAddress,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetDailyStats<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _DailyStats,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetMailPieces<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
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
export type GetMailPiece<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _MailPiece,
      _MailAddress,
      _File,
      _MailPieceStatusHistory,
    ],
    Input,
    Output
  >

