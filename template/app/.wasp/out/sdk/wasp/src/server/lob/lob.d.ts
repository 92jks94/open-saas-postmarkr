declare module 'lob' {
  interface LobOptions {
    apiKey: string;
  }

  interface Address {
    id?: string;
    name?: string;
    company?: string;
    address_line1: string;
    address_line2?: string;
    address_city: string;
    address_state: string;
    address_zip: string;
    address_country: string;
  }

  interface MailPiece {
    id?: string;
    to: Address;
    from: Address;
    description?: string;
    metadata?: Record<string, any>;
  }

  interface LobResponse<T = any> {
    id: string;
    object: string;
    status: string;
    tracking_number?: string;
    data: T;
  }

  interface VerificationRequest {
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  }

  interface VerificationResponse {
    deliverability: 'deliverable' | 'undeliverable' | 'deliverable_unnecessary_unit' | 'deliverable_incorrect_unit' | 'deliverable_missing_unit' | 'deliverable_missing_unit_no_zip' | 'deliverable_missing_unit_no_zip_no_street';
    address: Address;
  }

  class Lob {
    constructor(apiKey: string);
    
    addresses: {
      create(data: Address): Promise<LobResponse<Address>>;
      retrieve(id: string): Promise<LobResponse<Address>>;
      list(params?: any): Promise<{ data: LobResponse<Address>[] }>;
    };
    
    mailpieces: {
      create(data: MailPiece): Promise<LobResponse<MailPiece>>;
      retrieve(id: string): Promise<LobResponse<MailPiece>>;
      list(params?: any): Promise<{ data: LobResponse<MailPiece>[] }>;
    };

    usVerifications: {
      verify(data: VerificationRequest): Promise<VerificationResponse>;
    };
  }

  export = Lob;
}
