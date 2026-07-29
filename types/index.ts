/* ============================================================
   GlowFrame — shared TypeScript types
   ============================================================ */

export interface User {
  id?: number;
  displayName: string;
  fullName: string;
  email: string;
  phone?: string;
  profileImageUrl?: string;
  role?: 'user' | 'admin';
  phoneVerified: boolean;
  emailVerified: boolean;
  idVerified: boolean;
  suspended?: boolean;
}

export type { Address } from './address';

export interface Product {
  id: number;
  name: string;
  desc: string;
  price: number;
  deposit: number;
  color: string;
  rating: number;
  category?: {
    id: number;
    name: string;
  };
  brand?: {
    id?: number;
    name: string;
  };
  model?: string;
  serialNumber?: string;
  conditionNote?: string;
  extraDetails?: string;
  rejectionReason?: string;
  pickupAddressId?: number;
  customBrandName?: string;
  masterAccessories?: Array<{ accessoryId: number; quantity: number }>;
  customAccessories?: Array<{ name: string; quantity: number }>;
  accessories?: Array<{
    id: number | string;
    name: string;
    quantity: number;
  }>;
  media?: Array<{
    id: number;
    mediaType: 'image' | 'video';
    url: string;
    publicId?: string;
    sortOrder: number;
  }>;
  owner?: {
    displayName: string;
    rating?: number;
    verified?: boolean;
  };
  pickupArea?: {
    district: string;
    province: string;
  };
  status?: 'draft' | 'pending' | 'approved' | 'active' | 'rejected' | 'hidden' | 'archived';
  unavailableDates?: string[];
}

export type DayOption = '1' | '3' | '5' | 'custom';
export type DeliveryOption = 'pickup' | 'grab' | 'post';

export interface BookingState {
  productId: number | null;
  dayOption: DayOption;
  delivery: DeliveryOption;
  total?: number;
  days?: number;
  bookingId?: number;
  bookingNo?: string;
  startDate?: string;
  endDate?: string;
  paymentAccountId?: number;
  paymentProofName?: string;
  paymentStatus?: 'not_started' | 'pending_review' | 'approved' | 'rejected';
}

export interface AddProductState {
  title: string;
  categoryId: number | null;
  brandId: number | null;
  customBrandName: string;
  model: string;
  serialNumber: string;
  description: string;
  conditionNote: string;
  extraDetails: string;
  pricePerDay: string;
  depositAmount: string;
  pickupAddressId: number | null;
  accessories: Array<{ accessoryId: number; quantity: number }>;
  customAccessories: import('./product').ProductCustomAccessoryInput[];
}

export interface TxnPayState {
  method: 'qr' | 'card' | null;
  paymentAccountId: number | null;
  agree: boolean;
}

export interface WalletTransaction {
  id: number;
  name: string;
  kind?: 'payment';
  date: string;
  amt: number;
  status: string;
}

export interface Wallet {
  balance: number;
  history: WalletTransaction[];
}

/* ── API response shapes ─────────────────────────────────────── */
export type { ApiResponse } from './api';
export type * from './adminSettings';
export type * from './masterData';
export type * from './product';
