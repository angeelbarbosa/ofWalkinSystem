import type { Barber, CheckInRecord, ShopConfig } from '../types';

const BARBERS_KEY = 'of_barbers_v2';
const CHECKINS_KEY = 'of_checkins_v2';
const CONFIG_KEY = 'of_shop_config_v2';

export const DEFAULT_BARBERS: Barber[] = [
  {
    id: 'barber-1',
    name: 'Brandon',
    nickname: 'Brandon',
    specialty: 'Master Cuts & Grooming',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    avatarColor: '#3B82F6',
    phone: '(555) 234-5678',
    stationNumber: 1,
    isWorking: true,
    pushSubscriptionActive: true
  },
  {
    id: 'barber-2',
    name: 'Micah',
    nickname: 'Micah',
    specialty: 'Master Cuts & Grooming',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    avatarColor: '#10B981',
    phone: '(555) 345-6789',
    stationNumber: 2,
    isWorking: true,
    pushSubscriptionActive: true
  },
  {
    id: 'barber-3',
    name: 'Ruben',
    nickname: 'Ruben',
    specialty: 'Master Cuts & Grooming',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    avatarColor: '#F59E0B',
    phone: '(555) 456-7890',
    stationNumber: 3,
    isWorking: true,
    pushSubscriptionActive: true
  },
  {
    id: 'barber-4',
    name: 'Angel',
    nickname: 'Angel',
    specialty: 'Master Cuts & Grooming',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
    avatarColor: '#8B5CF6',
    phone: '(555) 567-8901',
    stationNumber: 4,
    isWorking: true,
    pushSubscriptionActive: true
  },
  {
    id: 'barber-5',
    name: 'Sosa',
    nickname: 'Sosa',
    specialty: 'Master Cuts & Grooming',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    avatarColor: '#EC4899',
    phone: '(555) 678-9012',
    stationNumber: 5,
    isWorking: true,
    pushSubscriptionActive: true
  },
  {
    id: 'barber-6',
    name: 'Barber 6',
    nickname: 'Barber 6',
    specialty: 'Master Cuts & Grooming',
    avatar: '',
    avatarColor: '#18181B',
    phone: '(555) 789-0123',
    stationNumber: 6,
    isWorking: true,
    pushSubscriptionActive: true
  },
  {
    id: 'barber-7',
    name: 'Barber 7',
    nickname: 'Barber 7',
    specialty: 'Master Cuts & Grooming',
    avatar: '',
    avatarColor: '#27272A',
    phone: '(555) 890-1234',
    stationNumber: 7,
    isWorking: true,
    pushSubscriptionActive: true
  }
];

export const DEFAULT_CONFIG: ShopConfig = {
  shopName: 'OF Supply & Lounge',
  tagline: 'Professional Grooming Essentials & Master Cuts',
  address: '104 Main Street, Suite A',
  welcomeShoppingTitle: 'Welcome In!',
  welcomeShoppingBody: 'Feel free to browse around. Let us know when you are ready to checkout!',
  shoppingCategories: [],
  shoppingAnnouncement: '',
  autoResetShoppingSec: 6,
  autoResetAppointmentSec: 6,
  soundAlertsEnabled: false,
  voiceAnnouncementsEnabled: false,
  vibrateEnabled: true,
  pinCode: '1234',
  allowWalkinsWithoutAppointment: false,
  twilioConfig: {
    enabled: false,
    accountSid: '',
    authToken: '',
    fromPhone: ''
  }
};

export const INITIAL_CHECKINS: CheckInRecord[] = [
  {
    id: 'chk-1',
    clientName: 'Jordan',
    clientPhone: '(555) 912-3456',
    type: 'appointment',
    barberId: 'barber-1',
    barberName: 'Brandon',
    appointmentTime: 'Appointment',
    checkInTime: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    status: 'in_chair'
  },
  {
    id: 'chk-2',
    clientName: 'Julian',
    clientPhone: '(555) 834-1290',
    type: 'appointment',
    barberId: 'barber-2',
    barberName: 'Micah',
    appointmentTime: 'Appointment',
    checkInTime: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    status: 'waiting'
  }
];

export const storage = {
  getBarbers(): Barber[] {
    try {
      const data = localStorage.getItem(BARBERS_KEY);
      if (!data) {
        localStorage.setItem(BARBERS_KEY, JSON.stringify(DEFAULT_BARBERS));
        return DEFAULT_BARBERS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_BARBERS;
    }
  },

  saveBarbers(barbers: Barber[]) {
    localStorage.setItem(BARBERS_KEY, JSON.stringify(barbers));
    window.dispatchEvent(new Event('barbers_updated'));
  },

  getConfig(): ShopConfig {
    try {
      const data = localStorage.getItem(CONFIG_KEY);
      if (!data) {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
        return DEFAULT_CONFIG;
      }
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    } catch {
      return DEFAULT_CONFIG;
    }
  },

  saveConfig(config: ShopConfig) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event('config_updated'));
  },

  getCheckIns(): CheckInRecord[] {
    try {
      const data = localStorage.getItem(CHECKINS_KEY);
      if (!data) {
        localStorage.setItem(CHECKINS_KEY, JSON.stringify(INITIAL_CHECKINS));
        return INITIAL_CHECKINS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_CHECKINS;
    }
  },

  saveCheckIns(records: CheckInRecord[]) {
    localStorage.setItem(CHECKINS_KEY, JSON.stringify(records));
    window.dispatchEvent(new Event('checkins_updated'));
  },

  addCheckIn(record: Omit<CheckInRecord, 'id' | 'checkInTime' | 'status'>): CheckInRecord {
    const records = this.getCheckIns();
    const newRecord: CheckInRecord = {
      ...record,
      id: 'chk-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      checkInTime: new Date().toISOString(),
      status: 'waiting'
    };
    const updated = [newRecord, ...records];
    this.saveCheckIns(updated);
    return newRecord;
  },

  updateCheckInStatus(id: string, status: CheckInRecord['status']) {
    const records = this.getCheckIns();
    const updated = records.map(r => 
      r.id === id ? { ...r, status, statusUpdatedAt: new Date().toISOString() } : r
    );
    this.saveCheckIns(updated);
  },

  clearCompletedCheckIns() {
    const records = this.getCheckIns();
    const updated = records.filter(r => r.status === 'waiting' || r.status === 'in_chair' || r.status === 'called');
    this.saveCheckIns(updated);
  }
};
