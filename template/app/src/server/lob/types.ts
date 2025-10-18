/**
 * TypeScript types for Lob API responses
 * 
 * These types provide type safety for Lob API interactions and replace 'any' types
 * throughout the codebase. Based on Lob API v1 documentation.
 */

/**
 * Common thumbnail structure used across Lob responses
 */
export interface LobThumbnails {
  small?: string;
  medium?: string;
  large?: string;
}

/**
 * Response from Lob Letter API
 * Used when creating letter-type mail pieces
 */
export interface LobLetterResponse {
  id: string;
  description?: string;
  metadata?: Record<string, string>;
  to: LobAddressResponse;
  from: LobAddressResponse;
  color: boolean;
  double_sided: boolean;
  address_placement: 'top_first_page' | 'insert_blank_page';
  return_envelope: boolean;
  perforated_page?: number;
  extra_service?: string;
  mail_type: string;
  url: string;
  merge_variables?: Record<string, any>;
  send_date?: string;
  carrier?: string;
  tracking_number?: string;
  tracking_events?: LobTrackingEvent[];
  thumbnails: LobThumbnails[];
  expected_delivery_date?: string;
  date_created: string;
  date_modified: string;
  deleted?: boolean;
  object: 'letter';
  price: string;
  status: string;
}

/**
 * Response from Lob Postcard API
 * Used when creating postcard-type mail pieces
 */
export interface LobPostcardResponse {
  id: string;
  description?: string;
  metadata?: Record<string, string>;
  to: LobAddressResponse;
  from: LobAddressResponse;
  size: '4x6' | '6x9' | '6x11';
  mail_type: string;
  url: string;
  front_template_id?: string;
  back_template_id?: string;
  front_template_version_id?: string;
  back_template_version_id?: string;
  carrier?: string;
  tracking_number?: string;
  tracking_events?: LobTrackingEvent[];
  thumbnails: LobThumbnails[];
  expected_delivery_date?: string;
  date_created: string;
  date_modified: string;
  send_date?: string;
  deleted?: boolean;
  object: 'postcard';
  price: string;
  status: string;
}

/**
 * Address object in Lob responses
 */
export interface LobAddressResponse {
  id?: string;
  description?: string;
  name?: string;
  company?: string;
  phone?: string;
  email?: string;
  address_line1: string;
  address_line2?: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country: string;
  metadata?: Record<string, string>;
  date_created?: string;
  date_modified?: string;
  object?: 'address';
}

/**
 * Tracking event structure from Lob
 */
export interface LobTrackingEvent {
  id: string;
  type: string;
  name: string;
  location?: string;
  time?: string;
  date_created: string;
  date_modified: string;
  object: 'tracking_event';
}

/**
 * Address verification response from Lob
 */
export interface LobAddressVerificationResponse {
  id?: string;
  recipient?: string;
  primary_line: string;
  secondary_line?: string;
  urbanization?: string;
  last_line: string;
  deliverability: 'deliverable' | 'deliverable_unnecessary_unit' | 'deliverable_incorrect_unit' | 'deliverable_missing_unit' | 'undeliverable';
  components: {
    primary_number: string;
    street_predirection?: string;
    street_name: string;
    street_suffix?: string;
    street_postdirection?: string;
    secondary_designator?: string;
    secondary_number?: string;
    pmb_designator?: string;
    pmb_number?: string;
    extra_secondary_designator?: string;
    extra_secondary_number?: string;
    city: string;
    state: string;
    zip_code: string;
    zip_code_plus_4?: string;
    zip_code_type?: string;
    delivery_point_barcode?: string;
    address_type?: string;
    record_type?: string;
    default_building_address?: boolean;
    county?: string;
    county_fips?: string;
    carrier_route?: string;
    carrier_route_type?: string;
    latitude?: number;
    longitude?: number;
  };
  object: 'us_verification';
}

/**
 * Error response from Lob API
 */
export interface LobErrorResponse {
  error: {
    message: string;
    status_code: number;
    code?: string;
  };
}

/**
 * Union type for all Lob mail piece responses
 */
export type LobMailPieceResponse = LobLetterResponse | LobPostcardResponse;

/**
 * Normalized response structure used internally
 * This is what our services return after processing Lob API responses
 */
export interface NormalizedLobResponse {
  id: string;
  status: string;
  trackingNumber: string;
  estimatedDeliveryDate: Date;
  cost: number; // in cents
  lobData?: LobMailPieceResponse; // Store full response for reference
}

/**
 * Type guard to check if response is a letter
 */
export function isLobLetterResponse(response: LobMailPieceResponse): response is LobLetterResponse {
  return response.object === 'letter';
}

/**
 * Type guard to check if response is a postcard
 */
export function isLobPostcardResponse(response: LobMailPieceResponse): response is LobPostcardResponse {
  return response.object === 'postcard';
}

/**
 * Type guard to check if error is a Lob error
 */
export function isLobError(error: any): error is LobErrorResponse {
  return error && typeof error === 'object' && 'error' in error && typeof error.error === 'object';
}

