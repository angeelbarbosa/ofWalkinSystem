import type { ThemeId } from './utils/themes';

export interface Barber {
  id: string;
  name: string;
  nickname?: string;
  specialty: string;
  avatar: string;
  avatarColor: string;
  phone: string;
  stationNumber: number;
  isWorking: boolean;
  pushSubscriptionActive?: boolean;
  // Booth Rent Configuration
  weeklyRent?: number; // e.g. 200
  rentCycle?: 'weekly' | 'biweekly' | 'monthly';
  rentDueDay?: string; // e.g. 'Monday'
  autoPayEnabled?: boolean;
  passcode?: string; // e.g. "1111"
}

export type CheckInType = 'shopping' | 'appointment' | 'walkin';
export type CheckInStatus = 'waiting' | 'called' | 'in_chair' | 'completed' | 'cancelled';

export interface CheckInRecord {
  id: string;
  clientName: string;
  clientPhone?: string;
  type: CheckInType;
  barberId?: string;
  barberName?: string;
  appointmentTime?: string; // e.g. "2:00 PM" or "Walk-in"
  checkInTime: string; // ISO string
  status: CheckInStatus;
  notes?: string;
  statusUpdatedAt?: string;
}

export type RentPaymentStatus = 'paid' | 'due' | 'overdue' | 'waived';
export type RentPaymentMethod = 'apple_pay' | 'card' | 'cash' | 'zelle' | 'manual';

export interface RentPaymentRecord {
  id: string;
  barberId: string;
  barberName: string;
  stationNumber: number;
  amount: number; // Base rent amount e.g. 200.00
  processingFee: number; // e.g. 6.18
  totalPaid: number; // e.g. 206.18
  feeCoveredByBarber: boolean;
  periodDescription: string; // e.g. "Week of Oct 5 – Oct 11, 2026"
  dueDate: string; // ISO or YYYY-MM-DD
  paidAt?: string; // ISO string
  status: RentPaymentStatus;
  paymentMethod?: RentPaymentMethod;
  receiptNumber: string; // e.g. "REC-89241"
  transactionId?: string;
  notes?: string;
}

export interface ShopConfig {
  shopName: string;
  tagline: string;
  address?: string;
  logoUrl?: string;
  themeId?: ThemeId;
  welcomeShoppingTitle: string;
  welcomeShoppingBody: string;
  shoppingCategories: string[];
  shoppingAnnouncement: string;
  autoResetShoppingSec: number;
  autoResetAppointmentSec: number;
  soundAlertsEnabled: boolean;
  voiceAnnouncementsEnabled: boolean;
  vibrateEnabled: boolean;
  pinCode: string;
  allowWalkinsWithoutAppointment: boolean;
  enableShoppingMode?: boolean; // true = Only for supply store kiosk; false = standard walkin + appointment barbershop
  // Booth Rent Shop Settings
  rentEnabled?: boolean;
  defaultWeeklyRent?: number; // e.g. 200
  defaultRentDueDay?: string; // 'Monday'
  passFeesToBarber?: boolean; // true = Barber pays 2.9% + $0.30 fee
  stripeConnectActive?: boolean;
  stripeAccountId?: string; // e.g. 'acct_1Nx48291...'
  stripePaymentLink?: string; // e.g. 'https://buy.stripe.com/...'
  payoutBankName?: string; // e.g. 'Chase Business •••• 4821'
  payoutStatus?: 'connected' | 'pending' | 'unlinked';
  payoutSchedule?: 'instant' | 'daily' | 'weekly';
  zelleRecipientPhone?: string;
  zelleRecipientEmail?: string;
  twilioConfig: {
    enabled: boolean;
    accountSid: string;
    authToken: string;
    fromPhone: string;
  };
}

export type SubscriptionStatus = 'active' | 'past_due' | 'comped' | 'unpaid';
export type SubscriptionPaymentMethod = 'zelle' | 'cash' | 'card' | 'stripe' | 'apple_pay' | 'manual';

export interface Shop {
  id: string; // e.g. 'shop-of'
  slug: string; // e.g. 'of' (used for URL: ?shop=of)
  name: string; // e.g. 'OF Supply & Lounge'
  tagline: string;
  address?: string;
  logoUrl?: string;
  themeId: ThemeId;
  pinCode: string;
  config: ShopConfig;
  barbers: Barber[];
  checkIns: CheckInRecord[];
  rentRecords: RentPaymentRecord[];
  status: 'active' | 'suspended';
  monthlyPlanPrice?: number; // e.g. 49
  
  // Platform Subscription & Owner Contact (Who pays YOU)
  subscriptionStatus?: SubscriptionStatus; // 'active' (Paid), 'past_due', 'comped', 'unpaid'
  subscriptionMonthlyFee?: number; // e.g. 49
  subscriptionNextBillingDate?: string; // YYYY-MM-DD e.g. "2026-11-01"
  subscriptionLastPaidDate?: string; // YYYY-MM-DD e.g. "2026-10-01"
  subscriptionPaymentMethod?: SubscriptionPaymentMethod;
  ownerContactName?: string; // e.g. "Marcus Rivera"
  ownerPhone?: string; // e.g. "(555) 777-1010"
  ownerEmail?: string; // e.g. "marcus@fademasters.com"
  
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  shopSlug: string;
  sender: 'shop_owner' | 'platform_hq';
  senderName: string; // e.g. "Marcus (Fade Masters)" or "Platform Support"
  text: string;
  createdAt: string; // ISO string
  readByHq: boolean;
  readByShop: boolean;
}

export type MainNavTab = 'landing' | 'kiosk' | 'barber_portal' | 'admin' | 'super_admin' | 'shop_select';
