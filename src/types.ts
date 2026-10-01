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
  twilioConfig: {
    enabled: boolean;
    accountSid: string;
    authToken: string;
    fromPhone: string;
  };
}

export type MainNavTab = 'kiosk' | 'barber_portal' | 'admin';
