import type { MailPiece, MailAddress, File, MailPieceStatusHistory } from 'wasp/entities';

// Extended MailPiece type with relations included
export type MailPieceWithRelations = MailPiece & {
  senderAddress: MailAddress;
  recipientAddress: MailAddress;
  file: File | null;
  statusHistory: MailPieceStatusHistory[];
};

// Extended MailAddress type for display purposes
export type MailAddressDisplay = {
  id: string;
  contactName: string;
  companyName: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  label: string | null;
  isDefault: boolean;
  addressType: string;
  isValidated: boolean;
  validationDate: Date | null;
  validationError: string | null;
  lobAddressId: string | null;
  usageCount: number;
  lastUsedAt: Date | null;
};

// Extended File type for display purposes
export type FileDisplay = {
  id: string;
  name: string;
  type: string;
  key: string;
  uploadUrl: string;
  size: number | null;
  isMailFile: boolean;
  validationStatus: string | null;
  validationError: string | null;
  pageCount: number | null;
  pdfMetadata: any;
  lastProcessedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// Extended MailPieceStatusHistory type
export type MailPieceStatusHistoryDisplay = {
  id: string;
  status: string;
  previousStatus: string | null;
  description: string | null;
  source: string;
  lobData: any;
  createdAt: Date;
};
