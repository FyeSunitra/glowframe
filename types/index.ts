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
    id: number;
    name: string;
  };
  model?: string;
  conditionNote?: string;
  extraDetails?: string;
  accessories?: Array<{
    id: number;
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
  status?: 'pending' | 'approved' | 'active' | 'rejected' | 'hidden' | 'archived';
  unavailableDates?: string[];
}

export type DayOption = '1' | '3' | '5' | 'custom';
export type DeliveryOption = 'pickup' | 'grab' | 'post';

export interface BookingState {
  productId: number | null;
  dayOption: DayOption;
  delivery: DeliveryOption;
  selectedDate: number | null;
  calMonth: number;
  calYear: number;
  total?: number;
  days?: number;
  bookingNo?: string;
  startDate?: string;
  endDate?: string;
  paymentProofName?: string;
  paymentStatus?: 'not_started' | 'pending_review' | 'approved' | 'rejected';
}

export interface AddProductState {
  title: string;
  categoryId: number | null;
  brandId: number | null;
  model: string;
  serialNumber: string;
  description: string;
  conditionNote: string;
  extraDetails: string;
  pricePerDay: string;
  depositAmount: string;
  pickupAddressId: number | null;
  accessories: Array<{ accessoryId: number; quantity: number }>;
}

export interface TxnPayState {
  method: 'qr' | 'card' | null;
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
