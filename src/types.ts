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
  // Booth Rent Shop Settings
  rentEnabled?: boolean;
  defaultWeeklyRent?: number; // e.g. 200
  defaultRentDueDay?: string; // 'Monday'
  passFeesToBarber?: boolean; // true = Barber pays 2.9% + $0.30 fee
  stripeConnectActive?: boolean;
  twilioConfig: {
    enabled: boolean;
    accountSid: string;
    authToken: string;
    fromPhone: string;
  };
}

export type MainNavTab = 'kiosk' | 'barber_portal' | 'admin';
