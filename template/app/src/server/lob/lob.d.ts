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

  interface PostcardData {
    to: Address;
    from: Address;
    front: string; // URL or HTML
    back?: string; // URL or HTML
    size?: '4x6' | '6x9';
    description?: string;
    color?: boolean;
    double_sided?: boolean;
    extra_service?: string;
  }

  interface LetterData {
    to: Address;
    from: Address;
    file: string; // URL or HTML content
    description?: string;
    color?: boolean;
    double_sided?: boolean;
    extra_service?: string;
  }

  interface CheckData {
    to: Address;
    from: Address;
    bank_account: string;
    amount: number;
    memo?: string;
    description?: string;
  }

  interface LobResponse<T = any> {
    id: string;
    object: string;
    status: string;
    price?: string;
    tracking_number?: string;
    expected_delivery_date?: string;
    date_created?: string;
    events?: Array<{
      name: string;
      description: string;
      date_created: string;
    }>;
    [key: string]: any;
  }

  interface VerificationRequest {
    primary_line: string;
    secondary_line?: string;
    city: string;
    state: string;
    zip_code: string;
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
    
    postcards: {
      create(data: PostcardData): Promise<LobResponse<PostcardData>>;
      retrieve(id: string): Promise<LobResponse<PostcardData>>;
      list(params?: any): Promise<{ data: LobResponse<PostcardData>[] }>;
    };

    letters: {
      create(data: LetterData): Promise<LobResponse<LetterData>>;
      retrieve(id: string): Promise<LobResponse<LetterData>>;
      list(params?: any): Promise<{ data: LobResponse<LetterData>[] }>;
    };

    checks: {
      create(data: CheckData): Promise<LobResponse<CheckData>>;
      retrieve(id: string): Promise<LobResponse<CheckData>>;
      list(params?: any): Promise<{ data: LobResponse<CheckData>[] }>;
    };

    usVerifications: {
      verify(data: VerificationRequest): Promise<VerificationResponse>;
    };
  }

  export = Lob;
}
