/* ============================================================
   Zustand store — client-side UI & booking state
   ============================================================ */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MenuLocale } from '@/lib/menuI18n';
import type {
  User, Address, Product,
  BookingState, AddProductState, TxnPayState,
} from '@/types';

const DEFAULT_USER: User = {
  displayName: '',
  fullName: '',
  email: '',
  phone: '',
  role: 'user',
  phoneVerified: false,
  emailVerified: true,
  idVerified: false,
  suspended: false,
};

const DEFAULT_BOOKING: BookingState = {
  productId: null,
  dayOption: '1',
  delivery: 'pickup',
  selectedDate: null,
  calMonth: new Date().getMonth(),
  calYear: new Date().getFullYear(),
  paymentStatus: 'not_started',
};

const DEFAULT_ADD_PRODUCT: AddProductState = {
  title: '',
  categoryId: null,
  brandId: null,
  model: '',
  serialNumber: '',
  description: '',
  conditionNote: '',
  extraDetails: '',
  pricePerDay: '',
  depositAmount: '',
  pickupAddressId: null,
  accessories: [],
};

interface AppStore {
  locale: MenuLocale;
  setLocale: (locale: MenuLocale) => void;

  /* auth */
  isAuthenticated: boolean;
  user: User;
  pendingSignupEmail: string;
  setPendingSignupEmail: (email: string) => void;
  login: (user: User) => void;
  logout: () => void;
  setUser: (patch: Partial<User>) => void;

  /* addresses */
  addresses: Address[];
  setAddresses: (addresses: Address[]) => void;
  addAddress: (addr: Omit<Address, 'id'>) => void;
  removeAddress: (id: number) => void;

  /* my listings (owner side) */
  myListings: Product[];
  addMyListing: (product: Product) => void;

  /* add-product form */
  addProduct: AddProductState;
  setAddProduct: (patch: Partial<AddProductState>) => void;
  resetAddProduct: () => void;

  /* booking flow */
  booking: BookingState;
  setBooking: (patch: Partial<BookingState>) => void;

  /* transaction payment */
  txnPay: TxnPayState;
  setTxnPay: (patch: Partial<TxnPayState>) => void;
  resetTxnPay: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
  locale: 'th',
  setLocale: (locale) => set({ locale }),

  /* ── auth ─────────────────────────────────────────────────── */
  isAuthenticated: false,
  user: DEFAULT_USER,
  pendingSignupEmail: '',
  setPendingSignupEmail: (email) => set({ pendingSignupEmail: email }),
  login: (user) =>
    set({
      isAuthenticated: true,
      user: { ...DEFAULT_USER, ...user },
    }),
  logout: () =>
    set({ isAuthenticated: false, user: DEFAULT_USER }),
  setUser: (patch) =>
    set((s) => ({ user: { ...s.user, ...patch } })),

  /* ── addresses ───────────────────────────────────────────── */
  addresses: [],
  setAddresses: (addresses) => set({ addresses }),
  addAddress: (addr) =>
    set((s) => ({
      addresses: [...s.addresses, { ...addr, id: Date.now() }],
    })),
  removeAddress: (id) =>
    set((s) => ({ addresses: s.addresses.filter((a) => a.id !== id) })),

  /* ── my listings ─────────────────────────────────────────── */
  myListings: [],
  addMyListing: (product) =>
    set((s) => ({ myListings: [...s.myListings, product] })),

  /* ── add-product form ────────────────────────────────────── */
  addProduct: DEFAULT_ADD_PRODUCT,
  setAddProduct: (patch) =>
    set((s) => ({ addProduct: { ...s.addProduct, ...patch } })),
  resetAddProduct: () =>
    set({ addProduct: DEFAULT_ADD_PRODUCT }),

  /* ── booking flow ────────────────────────────────────────── */
  booking: DEFAULT_BOOKING,
  setBooking: (patch) =>
    set((s) => ({ booking: { ...s.booking, ...patch } })),

  /* ── transaction payment ─────────────────────────────────── */
  txnPay: { method: null, agree: false },
  setTxnPay: (patch) =>
    set((s) => ({ txnPay: { ...s.txnPay, ...patch } })),
  resetTxnPay: () =>
    set({ txnPay: { method: null, agree: false } }),
    }),
    {
      name: 'glowframe-menu-locale',
      partialize: (state) => ({
        locale: state.locale,
        pendingSignupEmail: state.pendingSignupEmail,
      }),
    },
  ),
);
