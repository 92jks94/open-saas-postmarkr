import {
  type User,
  type GptResponse,
  type Task,
  type File,
  type DailyStats,
  type PageViewSource,
  type Logs,
  type ContactFormMessage,
  type MailAddress,
  type State,
  type MailPiece,
  type MailPieceStatusHistory,
  type Notification,
  type NotificationPreferences,
} from "@prisma/client"

export {
  type User,
  type GptResponse,
  type Task,
  type File,
  type DailyStats,
  type PageViewSource,
  type Logs,
  type ContactFormMessage,
  type MailAddress,
  type State,
  type MailPiece,
  type MailPieceStatusHistory,
  type Notification,
  type NotificationPreferences,
  type Auth,
  type AuthIdentity,
} from "@prisma/client"

export type Entity = 
  | User
  | GptResponse
  | Task
  | File
  | DailyStats
  | PageViewSource
  | Logs
  | ContactFormMessage
  | MailAddress
  | State
  | MailPiece
  | MailPieceStatusHistory
  | Notification
  | NotificationPreferences
  | never

export type EntityName = 
  | "User"
  | "GptResponse"
  | "Task"
  | "File"
  | "DailyStats"
  | "PageViewSource"
  | "Logs"
  | "ContactFormMessage"
  | "MailAddress"
  | "State"
  | "MailPiece"
  | "MailPieceStatusHistory"
  | "Notification"
  | "NotificationPreferences"
  | never
