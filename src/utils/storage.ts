import type { Barber, CheckInRecord, ShopConfig, RentPaymentRecord } from '../types';

const BARBERS_KEY = 'of_barbers_v2';
const CHECKINS_KEY = 'of_checkins_v2';
const CONFIG_KEY = 'of_shop_config_v2';
const RENT_KEY = 'of_rent_records_v2';

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
    pushSubscriptionActive: true,
    weeklyRent: 220,
    rentCycle: 'weekly',
    rentDueDay: 'Monday',
    autoPayEnabled: true,
    passcode: '1111'
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
    pushSubscriptionActive: true,
    weeklyRent: 200,
    rentCycle: 'weekly',
    rentDueDay: 'Monday',
    autoPayEnabled: false,
    passcode: '1111'
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
    pushSubscriptionActive: true,
    weeklyRent: 200,
    rentCycle: 'weekly',
    rentDueDay: 'Monday',
    autoPayEnabled: false,
    passcode: '1111'
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
    pushSubscriptionActive: true,
    weeklyRent: 200,
    rentCycle: 'weekly',
    rentDueDay: 'Monday',
    autoPayEnabled: true,
    passcode: '1111'
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
    pushSubscriptionActive: true,
    weeklyRent: 200,
    rentCycle: 'weekly',
    rentDueDay: 'Monday',
    autoPayEnabled: false,
    passcode: '1111'
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
    pushSubscriptionActive: true,
    weeklyRent: 200,
    rentCycle: 'weekly',
    rentDueDay: 'Monday',
    autoPayEnabled: false,
    passcode: '1111'
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
    pushSubscriptionActive: true,
    weeklyRent: 200,
    rentCycle: 'weekly',
    rentDueDay: 'Monday',
    autoPayEnabled: false,
    passcode: '1111'
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
  rentEnabled: true,
  defaultWeeklyRent: 200,
  defaultRentDueDay: 'Monday',
  passFeesToBarber: true,
  stripeConnectActive: true,
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

export const INITIAL_RENT_RECORDS: RentPaymentRecord[] = [
  {
    id: 'rent-1',
    barberId: 'barber-1',
    barberName: 'Brandon',
    stationNumber: 1,
    amount: 220.00,
    processingFee: 6.68,
    totalPaid: 226.68,
    feeCoveredByBarber: true,
    periodDescription: 'Week of Oct 5 – Oct 11, 2026',
    dueDate: '2026-10-05',
    paidAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    status: 'paid',
    paymentMethod: 'apple_pay',
    receiptNumber: 'REC-90214',
    notes: 'Auto-charged via Apple Pay'
  },
  {
    id: 'rent-2',
    barberId: 'barber-3',
    barberName: 'Ruben',
    stationNumber: 3,
    amount: 200.00,
    processingFee: 0.00,
    totalPaid: 200.00,
    feeCoveredByBarber: false,
    periodDescription: 'Week of Oct 5 – Oct 11, 2026',
    dueDate: '2026-10-05',
    paidAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: 'paid',
    paymentMethod: 'zelle',
    receiptNumber: 'REC-90215',
    notes: 'Paid via Zelle / Verified by Owner'
  },
  {
    id: 'rent-3',
    barberId: 'barber-4',
    barberName: 'Angel',
    stationNumber: 4,
    amount: 200.00,
    processingFee: 6.10,
    totalPaid: 206.10,
    feeCoveredByBarber: true,
    periodDescription: 'Week of Oct 5 – Oct 11, 2026',
    dueDate: '2026-10-05',
    paidAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    status: 'paid',
    paymentMethod: 'card',
    receiptNumber: 'REC-90216',
    notes: 'Paid via Visa debit ending in 4242'
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
  },

  // Booth Rent Ledger Storage Methods
  getRentRecords(): RentPaymentRecord[] {
    try {
      const data = localStorage.getItem(RENT_KEY);
      if (!data) {
        localStorage.setItem(RENT_KEY, JSON.stringify(INITIAL_RENT_RECORDS));
        return INITIAL_RENT_RECORDS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_RENT_RECORDS;
    }
  },

  saveRentRecords(records: RentPaymentRecord[]) {
    localStorage.setItem(RENT_KEY, JSON.stringify(records));
    window.dispatchEvent(new Event('rent_updated'));
  },

  recordRentPayment(record: Omit<RentPaymentRecord, 'id' | 'receiptNumber'>): RentPaymentRecord {
    const records = this.getRentRecords();
    const receiptNumber = 'REC-' + Math.floor(10000 + Math.random() * 90000);
    const newRecord: RentPaymentRecord = {
      ...record,
      id: 'rent-' + Date.now(),
      receiptNumber
    };
    const updated = [newRecord, ...records];
    this.saveRentRecords(updated);
    return newRecord;
  },

  updateRentRecordStatus(id: string, status: RentPaymentRecord['status'], paymentMethod?: RentPaymentRecord['paymentMethod'], notes?: string) {
    const records = this.getRentRecords();
    const updated = records.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status,
          ...(paymentMethod ? { paymentMethod } : {}),
          ...(status === 'paid' ? { paidAt: new Date().toISOString() } : {}),
          ...(notes ? { notes } : {})
        };
      }
      return r;
    });
    this.saveRentRecords(updated);
  }
};
