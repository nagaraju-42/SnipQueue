// SnipQ Shared Types
// Shared between apps/api and apps/web

// ── Enums ──────────────────────────────────────────

export enum Role {
  CUSTOMER = 'CUSTOMER',
  BARBER = 'BARBER',
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
}

export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  CONFIRMED = 'CONFIRMED',
  WALK_IN = 'WALK_IN',
  BLOCKED = 'BLOCKED',
  IN_SERVICE = 'IN_SERVICE',
  COMPLETED = 'COMPLETED',
}

export enum BookingStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  ARRIVED = 'ARRIVED',
  IN_SERVICE = 'IN_SERVICE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

// ── User ───────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  fcmToken?: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Salon ──────────────────────────────────────────

export interface Salon {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  pincode: string;
  openTime: string;
  closeTime: string;
  slotDurationMin: number;
  phonePeQrUrl?: string | null;
  isActive: boolean;
  avgRating: number;
  createdAt: string;
  barbers?: Barber[];
  services?: Service[];
}

// ── Barber ─────────────────────────────────────────

export interface Barber {
  id: string;
  salonId: string;
  userId: string;
  user?: User;
  profilePhotoUrl?: string | null;
  isActive: boolean;
  avgRating: number;
  totalServed: number;
}

// ── Service ────────────────────────────────────────

export interface Service {
  id: string;
  salonId: string;
  name: string;
  price: number;
  durationMin: number;
  isActive: boolean;
}

// ── Slot ───────────────────────────────────────────

export interface Slot {
  id: string;
  barberId: string;
  salonId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
}

// ── Booking ────────────────────────────────────────

export interface Booking {
  id: string;
  customerId: string;
  customer?: User;
  barberId: string;
  barber?: Barber;
  slotId: string;
  slot?: Slot;
  serviceId: string;
  service?: Service;
  status: BookingStatus;
  checkinOtp: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  commitmentFeePaid: boolean;
  servicePaymentReceived: boolean;
  createdAt: string;
  updatedAt: string;
  rating?: Rating;
}

// ── WalkIn ─────────────────────────────────────────

export interface WalkIn {
  id: string;
  barberId: string;
  salonId: string;
  slotId: string;
  serviceId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  paymentReceived: boolean;
  paymentMethod?: string | null;
  createdAt: string;
}

// ── Rating ─────────────────────────────────────────

export interface Rating {
  id: string;
  bookingId: string;
  customerId: string;
  barberId: string;
  stars: number;
  comment?: string | null;
  createdAt: string;
}

// ── SalaryRecord ───────────────────────────────────

export interface SalaryRecord {
  id: string;
  barberId: string;
  periodStart: string;
  periodEnd: string;
  slotsCompleted: number;
  salaryAmount: number;
  paidAt?: string | null;
  paidBy?: string | null;
  createdAt: string;
}

// ── API Response Envelopes ─────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ── Auth Types ─────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

// ── Queue Types ────────────────────────────────────

export interface QueueItem {
  position: number;
  bookingId: string;
  customerName: string;
  serviceName: string;
  slotStartTime: string;
  status: BookingStatus;
  isWalkIn: boolean;
}

export interface QueueUpdate {
  barberId: string;
  queue: QueueItem[];
  myPosition?: number | null;
  totalInQueue: number;
  currentlyServing?: QueueItem | null;
  estimatedWaitMin?: number | null;
}

// ── Booking Flow Types ─────────────────────────────

export interface InitiateBookingRequest {
  slotId: string;
  barberId: string;
  serviceId: string;
}

export interface InitiateBookingResponse {
  bookingId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  checkinOtp: string;
}

// ── Owner Dashboard Types ──────────────────────────

export interface DashboardSummary {
  totalBookingsToday: number;
  totalWalkInsToday: number;
  estimatedRevenueToday: number;
  activeBarbers: number;
  totalBarbers: number;
  currentlyServing: number;
}

export interface SalaryComputation {
  barberId: string;
  barberName: string;
  periodStart: string;
  periodEnd: string;
  confirmedSlots: number;
  walkInSlots: number;
  totalSlots: number;
  ratePerSlot: number;
  totalSalary: number;
  avgRating: number;
  isPaid: boolean;
}

// ── Socket Events ──────────────────────────────────

export interface SocketEvents {
  join_barber_queue: { barberId: string };
  leave_barber_queue: { barberId: string };
  queue_updated: QueueUpdate;
  booking_confirmed: { bookingId: string; barberId: string };
  youre_next: { bookingId: string; barberId: string };
}
