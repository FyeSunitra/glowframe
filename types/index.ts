/* ============================================================
   GlowFrame — shared TypeScript types
   ============================================================ */

export interface User {
  displayName: string;
  fullName: string;
  email: string;
  role?: 'user' | 'admin';
  phoneVerified: boolean;
  emailVerified: boolean;
  idVerified: boolean;
  suspended?: boolean;
}

export interface Address {
  id: number;
  label: string;
  detail: string;
}

export interface Product {
  id: number;
  name: string;
  desc: string;
  price: number;
  deposit: number;
  color: string;
  rating: number;
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
  name: string;
  desc: string;
  extra: string;
  price: string;
  deposit: string;
  addressId: number | null;
}

export interface TxnPayState {
  method: 'qr' | 'card' | null;
  agree: boolean;
}

export interface WalletTransaction {
  id: number;
  name: string;
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
