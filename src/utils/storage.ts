import type { 
  Barber, 
  CheckInRecord, 
  ShopConfig, 
  RentPaymentRecord, 
  Shop, 
  SupportMessage, 
  SubscriptionPaymentMethod, 
  SubscriptionStatus 
} from '../types';
import type { ThemeId } from './themes';

const SHOPS_KEY = 'walkin_shops_v3';
const ACTIVE_SHOP_KEY = 'walkin_active_shop_slug';
const MASTER_PIN_KEY = 'walkin_master_pin';
const SUPPORT_MESSAGES_KEY = 'walkin_support_messages_v1';

// Real-time cross-tab & cross-window sync broadcaster
const SYNC_BROADCAST_CHANNEL = 'of_system_sync_broadcast_v1';
let syncChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    syncChannel = new BroadcastChannel(SYNC_BROADCAST_CHANNEL);
  } catch (e) {
    console.warn('BroadcastChannel init warning:', e);
  }
}

export function broadcastSystemEvent(eventType: string, detail?: any) {
  if (typeof window === 'undefined') return;
  // 1. Same-tab event
  window.dispatchEvent(new CustomEvent(eventType, { detail }));
  
  // 2. Cross-tab event
  if (syncChannel) {
    try {
      syncChannel.postMessage({ eventType, detail, timestamp: Date.now() });
    } catch (e) {
      console.warn('Broadcast error:', e);
    }
  }
}

// Default Master Super Admin PIN (For platform owner)
export const DEFAULT_MASTER_PIN = '9999';

// Seed Initial Shop 1: OF Supply & Lounge (The original barbershop)
export const DEFAULT_OF_BARBERS: Barber[] = [
  {
    id: 'barber-1',
    name: 'Brandon',
    nickname: 'Brandon',
    specialty: 'Master Cuts & Grooming',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    avatarColor: '#F59E0B',
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

export const DEFAULT_OF_CONFIG: ShopConfig = {
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
  enableShoppingMode: true,
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

export const INITIAL_OF_CHECKINS: CheckInRecord[] = [
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

export const INITIAL_OF_RENT: RentPaymentRecord[] = [
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
    paymentMethod: 'stripe',
    receiptNumber: 'REC-90215',
    notes: 'Paid via Stripe / Verified by Owner'
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

// Initial Seed Support Messages
export const INITIAL_SUPPORT_MESSAGES: SupportMessage[] = [
  {
    id: 'msg-1',
    shopSlug: 'fademasters',
    sender: 'shop_owner',
    senderName: 'Marcus (Fade Masters)',
    text: 'Hey Angel! Loving the new kiosk setup. Quick question, how do I change my station rent due day to Tuesday?',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    readByHq: false,
    readByShop: true
  },
  {
    id: 'msg-2',
    shopSlug: 'royalcuts',
    sender: 'shop_owner',
    senderName: 'Dominic (Royal Cuts)',
    text: 'Everything looks great on our iPad! Sent over our monthly subscription payment on Zelle.',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    readByHq: true,
    readByShop: true
  },
  {
    id: 'msg-3',
    shopSlug: 'royalcuts',
    sender: 'platform_hq',
    senderName: 'Angel (Platform HQ)',
    text: 'Awesome Dominic! Received and marked your shop active through November 1st. Let me know if you need anything else!',
    createdAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
    readByHq: true,
    readByShop: true
  },
  {
    id: 'msg-4',
    shopSlug: 'of',
    sender: 'platform_hq',
    senderName: 'Platform HQ',
    text: 'Welcome to your shop direct line! If you have any questions about booth rent, iPads, or settings, chat with us right here.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    readByHq: true,
    readByShop: true
  }
];

// Initial Seed Shops
export const SEED_SHOPS: Shop[] = [
  {
    id: 'shop-of',
    slug: 'of',
    name: 'OF Supply & Lounge',
    tagline: 'Professional Grooming Essentials & Master Cuts',
    address: '104 Main Street, Suite A',
    logoUrl: '/logo.png',
    themeId: 'obsidian_emerald',
    pinCode: '1234',
    config: DEFAULT_OF_CONFIG,
    barbers: DEFAULT_OF_BARBERS,
    checkIns: INITIAL_OF_CHECKINS,
    rentRecords: INITIAL_OF_RENT,
    status: 'active',
    monthlyPlanPrice: 0,
    subscriptionStatus: 'comped',
    subscriptionMonthlyFee: 0,
    ownerContactName: 'Angel Barbosa',
    ownerPhone: '(555) 234-5678',
    ownerEmail: 'angel@ofsupply.com',
    createdAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'shop-fademasters',
    slug: 'fademasters',
    name: 'Fade Masters Downtown',
    tagline: 'Precision Fades, Beard Sculpting & Hot Towel Shaves',
    address: '420 Broadway Ave, Downtown',
    themeId: 'obsidian_emerald',
    pinCode: '1234',
    subscriptionStatus: 'active',
    subscriptionMonthlyFee: 49,
    subscriptionNextBillingDate: '2026-11-01',
    subscriptionLastPaidDate: '2026-10-01',
    subscriptionPaymentMethod: 'stripe',
    ownerContactName: 'Marcus Rivera',
    ownerPhone: '(555) 777-1010',
    ownerEmail: 'marcus@fademasters.com',
    config: {
      ...DEFAULT_OF_CONFIG,
      shopName: 'Fade Masters Downtown',
      tagline: 'Precision Fades & Luxury Grooming',
      welcomeShoppingTitle: 'Welcome to Fade Masters',
      welcomeShoppingBody: 'Check in for your appointment or sign in for walk-in rotation.',
      allowWalkinsWithoutAppointment: true,
      enableShoppingMode: false,
      defaultWeeklyRent: 250
    },
    barbers: [
      {
        id: 'fm-1',
        name: 'Marcus "FadeKing"',
        nickname: 'Marcus',
        specialty: 'Skin Fades & Designs',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
        avatarColor: '#10B981',
        phone: '(555) 777-1010',
        stationNumber: 1,
        isWorking: true,
        pushSubscriptionActive: true,
        weeklyRent: 250,
        rentCycle: 'weekly',
        rentDueDay: 'Monday',
        autoPayEnabled: true,
        passcode: '1111'
      },
      {
        id: 'fm-2',
        name: 'Diego Blade',
        nickname: 'Diego',
        specialty: 'Beards & Lineups',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        avatarColor: '#059669',
        phone: '(555) 777-2020',
        stationNumber: 2,
        isWorking: true,
        pushSubscriptionActive: true,
        weeklyRent: 250,
        rentCycle: 'weekly',
        rentDueDay: 'Monday',
        autoPayEnabled: false,
        passcode: '1111'
      },
      {
        id: 'fm-3',
        name: 'Jordan Kicks',
        nickname: 'Jordan',
        specialty: 'Taper Fades & Scissor Work',
        avatar: '',
        avatarColor: '#047857',
        phone: '(555) 777-3030',
        stationNumber: 3,
        isWorking: true,
        pushSubscriptionActive: true,
        weeklyRent: 250,
        rentCycle: 'weekly',
        rentDueDay: 'Monday',
        autoPayEnabled: false,
        passcode: '1111'
      }
    ],
    checkIns: [
      {
        id: 'fm-chk-1',
        clientName: 'Alex Rivera',
        clientPhone: '(555) 444-1212',
        type: 'appointment',
        barberId: 'fm-1',
        barberName: 'Marcus "FadeKing"',
        appointmentTime: 'Appointment',
        checkInTime: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        status: 'in_chair'
      }
    ],
    rentRecords: [],
    status: 'active',
    monthlyPlanPrice: 49,
    createdAt: '2026-03-01T00:00:00.000Z'
  },
  {
    id: 'shop-royalcuts',
    slug: 'royalcuts',
    name: 'Royal Cuts Lounge',
    tagline: 'Classic Gentlemen Barbershop & Hot Towel Treatment',
    address: '88 Heritage Square',
    themeId: 'classic_heritage',
    pinCode: '1234',
    config: {
      ...DEFAULT_OF_CONFIG,
      shopName: 'Royal Cuts Lounge',
      tagline: 'Classic Gentlemen Barbershop',
      welcomeShoppingTitle: 'Welcome to Royal Cuts',
      welcomeShoppingBody: 'Please check in with your barber on arrival.',
      allowWalkinsWithoutAppointment: true,
      enableShoppingMode: false,
      defaultWeeklyRent: 200
    },
    barbers: [
      {
        id: 'rc-1',
        name: 'Dominic "The Barber"',
        nickname: 'Dominic',
        specialty: 'Classic Scissor Cuts',
        avatar: '',
        avatarColor: '#EF4444',
        phone: '(555) 888-1111',
        stationNumber: 1,
        isWorking: true,
        pushSubscriptionActive: true,
        weeklyRent: 200,
        rentCycle: 'weekly',
        rentDueDay: 'Monday',
        autoPayEnabled: true,
        passcode: '1111'
      },
      {
        id: 'rc-2',
        name: 'Lucas Sharp',
        nickname: 'Lucas',
        specialty: 'Razor Fades & Shaves',
        avatar: '',
        avatarColor: '#2563EB',
        phone: '(555) 888-2222',
        stationNumber: 2,
        isWorking: true,
        pushSubscriptionActive: true,
        weeklyRent: 200,
        rentCycle: 'weekly',
        rentDueDay: 'Monday',
        autoPayEnabled: false,
        passcode: '1111'
      }
    ],
    checkIns: [],
    rentRecords: [],
    status: 'active',
    monthlyPlanPrice: 49,
    subscriptionStatus: 'past_due',
    subscriptionMonthlyFee: 49,
    subscriptionNextBillingDate: '2026-10-01',
    subscriptionLastPaidDate: '2026-09-01',
    subscriptionPaymentMethod: 'stripe',
    ownerContactName: 'Dominic V.',
    ownerPhone: '(555) 888-1111',
    ownerEmail: 'dominic@royalcuts.com',
    createdAt: '2026-03-10T00:00:00.000Z'
  }
];

export const storage = {
  // Master Super Admin PIN
  getMasterPin(): string {
    return localStorage.getItem(MASTER_PIN_KEY) || DEFAULT_MASTER_PIN;
  },

  setMasterPin(newPin: string) {
    localStorage.setItem(MASTER_PIN_KEY, newPin);
  },

  // Active Shop Management (Defaults to 'of' for existing home screen users!)
  getActiveShopSlug(): string {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlShop = urlParams.get('shop');
      if (urlShop) {
        localStorage.setItem(ACTIVE_SHOP_KEY, urlShop.toLowerCase());
        return urlShop.toLowerCase();
      }
      return localStorage.getItem(ACTIVE_SHOP_KEY) || 'of';
    }
    return 'of';
  },

  setActiveShopSlug(slug: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_SHOP_KEY, slug.toLowerCase());
      broadcastSystemEvent('shop_switched', { slug });
    }
  },

  // All Shops in the Multi-Tenant System
  getShops(): Shop[] {
    try {
      const data = localStorage.getItem(SHOPS_KEY);
      if (!data) {
        localStorage.setItem(SHOPS_KEY, JSON.stringify(SEED_SHOPS));
        return SEED_SHOPS;
      }
      const parsed: Shop[] = JSON.parse(data);
      
      // Initialize defaults only if undefined
      parsed.forEach(s => {
        if (!s.config) {
          s.config = { ...DEFAULT_OF_CONFIG, shopName: s.name };
        }
        if (s.config.enableShoppingMode === undefined) {
          s.config.enableShoppingMode = s.slug === 'of';
        }
        if (s.config.allowWalkinsWithoutAppointment === undefined) {
          s.config.allowWalkinsWithoutAppointment = s.slug !== 'of';
        }
        if (!s.subscriptionStatus) {
          s.subscriptionStatus = s.slug === 'of' ? 'comped' : (s.slug === 'royalcuts' ? 'past_due' : 'active');
        }
        if (s.subscriptionMonthlyFee === undefined) {
          s.subscriptionMonthlyFee = s.slug === 'of' ? 0 : 49;
        }
        if (!s.ownerContactName) {
          s.ownerContactName = s.slug === 'of' ? 'Angel Barbosa' : (s.slug === 'royalcuts' ? 'Dominic V.' : 'Marcus Rivera');
        }
        if (!s.ownerPhone) {
          s.ownerPhone = s.slug === 'of' ? '(555) 234-5678' : (s.slug === 'royalcuts' ? '(555) 888-1111' : '(555) 777-1010');
        }
      });

      // Ensure 'of' exists
      if (!parsed.some(s => s.slug === 'of')) {
        const merged = [...SEED_SHOPS.filter(s => s.slug === 'of'), ...parsed];
        localStorage.setItem(SHOPS_KEY, JSON.stringify(merged));
        return merged;
      }
      localStorage.setItem(SHOPS_KEY, JSON.stringify(parsed));
      return parsed;
    } catch {
      return SEED_SHOPS;
    }
  },

  saveShops(shops: Shop[]) {
    localStorage.setItem(SHOPS_KEY, JSON.stringify(shops));
    broadcastSystemEvent('shops_updated');
  },

  getActiveShop(): Shop {
    const slug = this.getActiveShopSlug();
    const shops = this.getShops();
    const found = shops.find(s => s.slug === slug || s.id === slug);
    return found || shops[0] || SEED_SHOPS[0];
  },

  getShopBySlug(slug: string): Shop | undefined {
    const shops = this.getShops();
    return shops.find(s => s.slug.toLowerCase() === slug.toLowerCase() || s.id === slug);
  },

  createShop(shopData: Partial<Shop> & { name: string; slug: string; themeId: ThemeId }): Shop {
    const shops = this.getShops();
    const cleanSlug = shopData.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');
    
    // Check if slug already exists
    if (shops.some(s => s.slug === cleanSlug)) {
      throw new Error(`A barbershop with link code "${cleanSlug}" already exists.`);
    }

    const newShop: Shop = {
      id: 'shop-' + Date.now(),
      slug: cleanSlug,
      name: shopData.name,
      tagline: shopData.tagline || 'Master Grooming & Precision Cuts',
      address: shopData.address || '',
      logoUrl: shopData.logoUrl || '',
      themeId: shopData.themeId || 'midnight_gold',
      pinCode: shopData.pinCode || '1234',
      status: 'active',
      monthlyPlanPrice: shopData.subscriptionMonthlyFee !== undefined ? Number(shopData.subscriptionMonthlyFee) : 49,
      subscriptionStatus: (shopData.subscriptionStatus || 'active') as SubscriptionStatus,
      subscriptionMonthlyFee: shopData.subscriptionMonthlyFee !== undefined ? Number(shopData.subscriptionMonthlyFee) : 49,
      subscriptionNextBillingDate: shopData.subscriptionNextBillingDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subscriptionLastPaidDate: new Date().toISOString().split('T')[0],
      subscriptionPaymentMethod: shopData.subscriptionPaymentMethod || 'stripe',
      ownerContactName: shopData.ownerContactName || '',
      ownerPhone: shopData.ownerPhone || '',
      ownerEmail: shopData.ownerEmail || '',
      createdAt: new Date().toISOString(),
      config: {
        shopName: shopData.name,
        tagline: shopData.tagline || 'Master Grooming & Precision Cuts',
        address: shopData.address || '',
        welcomeShoppingTitle: `Welcome to ${shopData.name}!`,
        welcomeShoppingBody: 'Please check in for your appointment or walk-in.',
        shoppingCategories: [],
        shoppingAnnouncement: '',
        autoResetShoppingSec: 6,
        autoResetAppointmentSec: 6,
        soundAlertsEnabled: false,
        voiceAnnouncementsEnabled: false,
        vibrateEnabled: true,
        pinCode: shopData.pinCode || '1234',
        allowWalkinsWithoutAppointment: true,
        enableShoppingMode: false,
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
      },
      barbers: [
        {
          id: `barber-${Date.now()}-1`,
          name: 'Lead Barber',
          nickname: 'Lead',
          specialty: 'Master Cuts',
          avatar: '',
          avatarColor: '#F59E0B',
          phone: '(555) 000-0001',
          stationNumber: 1,
          isWorking: true,
          pushSubscriptionActive: true,
          weeklyRent: 200,
          rentCycle: 'weekly',
          rentDueDay: 'Monday',
          autoPayEnabled: false,
          passcode: '1111'
        }
      ],
      checkIns: [],
      rentRecords: []
    };

    const updated = [...shops, newShop];
    this.saveShops(updated);
    return newShop;
  },

  updateShop(slug: string, updates: Partial<Shop>): Shop {
    const shops = this.getShops();
    let updatedShop: Shop | null = null;

    const newShops = shops.map(s => {
      if (s.slug === slug || s.id === slug) {
        const merged: Shop = {
          ...s,
          ...updates,
          config: {
            ...s.config,
            ...(updates.config || {}),
            ...(updates.name ? { shopName: updates.name } : {}),
            ...(updates.tagline ? { tagline: updates.tagline } : {}),
            ...(updates.address ? { address: updates.address } : {}),
            ...(updates.pinCode ? { pinCode: updates.pinCode } : {})
          }
        };
        updatedShop = merged;
        return merged;
      }
      return s;
    });

    this.saveShops(newShops);
    return updatedShop || this.getActiveShop();
  },

  deleteShop(slug: string) {
    const shops = this.getShops();
    const filtered = shops.filter(s => s.slug !== slug && s.id !== slug);
    const remaining = filtered.length > 0 ? filtered : [SEED_SHOPS[0]];
    this.saveShops(remaining);
    if (this.getActiveShopSlug() === slug) {
      this.setActiveShopSlug(remaining[0].slug);
    }
  },

  // 🧹 Factory Reset: Clean slate for selling to barbershops
  factoryResetPlatform() {
    const cleanOF: Shop = {
      id: 'shop-of',
      slug: 'of',
      name: 'OF Supply & Lounge',
      tagline: 'Professional Grooming Essentials & Master Cuts',
      address: '104 Main Street, Suite A',
      logoUrl: '/logo.png',
      themeId: 'obsidian_emerald',
      pinCode: '1234',
      config: DEFAULT_OF_CONFIG,
      barbers: DEFAULT_OF_BARBERS,
      checkIns: [],
      rentRecords: [],
      status: 'active',
      monthlyPlanPrice: 49,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(SHOPS_KEY, JSON.stringify([cleanOF]));
    localStorage.setItem(ACTIVE_SHOP_KEY, 'of');
    localStorage.setItem(MASTER_PIN_KEY, DEFAULT_MASTER_PIN);
    broadcastSystemEvent('shops_updated');
    broadcastSystemEvent('shop_switched', { slug: 'of' });
  },

  // 🎲 Load Demo Fleet: Re-seeds OF, Fade Masters, and Royal Cuts for live testing
  loadDemoFleet() {
    localStorage.setItem(SHOPS_KEY, JSON.stringify(SEED_SHOPS));
    localStorage.setItem(ACTIVE_SHOP_KEY, 'of');
    broadcastSystemEvent('shops_updated');
    broadcastSystemEvent('shop_switched', { slug: 'of' });
  },

  // -------------------------------------------------------------
  // Scoped active-shop helpers (Backward-compatible for components)
  // -------------------------------------------------------------

  getBarbers(): Barber[] {
    const shop = this.getActiveShop();
    return shop.barbers || [];
  },

  saveBarbers(barbers: Barber[]) {
    const shop = this.getActiveShop();
    this.updateShop(shop.slug, { barbers });
    broadcastSystemEvent('barbers_updated');
  },

  getConfig(): ShopConfig {
    const shop = this.getActiveShop();
    return shop.config;
  },

  saveConfig(config: ShopConfig) {
    const shop = this.getActiveShop();
    this.updateShop(shop.slug, {
      name: config.shopName,
      tagline: config.tagline,
      address: config.address,
      pinCode: config.pinCode,
      config
    });
    broadcastSystemEvent('config_updated');
  },

  getCheckIns(): CheckInRecord[] {
    const shop = this.getActiveShop();
    return shop.checkIns || [];
  },

  saveCheckIns(records: CheckInRecord[]) {
    const shop = this.getActiveShop();
    this.updateShop(shop.slug, { checkIns: records });
    broadcastSystemEvent('checkins_updated');
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

  claimCheckIn(id: string, barberId: string, barberName: string, status: CheckInRecord['status'] = 'waiting') {
    const records = this.getCheckIns();
    const updated = records.map(r => 
      r.id === id 
        ? { ...r, barberId, barberName, status, statusUpdatedAt: new Date().toISOString(), notes: 'claimed' } 
        : r
    );
    this.saveCheckIns(updated);
  },

  clearCompletedCheckIns() {
    const records = this.getCheckIns();
    const updated = records.filter(r => r.status === 'waiting' || r.status === 'in_chair' || r.status === 'called');
    this.saveCheckIns(updated);
  },

  getRentRecords(): RentPaymentRecord[] {
    const shop = this.getActiveShop();
    return shop.rentRecords || [];
  },

  saveRentRecords(records: RentPaymentRecord[]) {
    const shop = this.getActiveShop();
    this.updateShop(shop.slug, { rentRecords: records });
    broadcastSystemEvent('rent_updated');
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
  },

  // -------------------------------------------------------------
  // 💬 IN-APP SUPPORT MESSAGING (Shop Owners ◄► Platform HQ)
  // -------------------------------------------------------------

  getSupportMessages(shopSlug?: string): SupportMessage[] {
    try {
      const data = localStorage.getItem(SUPPORT_MESSAGES_KEY);
      let messages: SupportMessage[];
      if (!data) {
        localStorage.setItem(SUPPORT_MESSAGES_KEY, JSON.stringify(INITIAL_SUPPORT_MESSAGES));
        messages = INITIAL_SUPPORT_MESSAGES;
      } else {
        const parsed = JSON.parse(data);
        messages = Array.isArray(parsed) ? parsed : INITIAL_SUPPORT_MESSAGES;
      }
      if (shopSlug) {
        const cleanSlug = shopSlug.toLowerCase().trim();
        return messages.filter(m => (m.shopSlug || '').toLowerCase().trim() === cleanSlug);
      }
      return messages;
    } catch {
      return INITIAL_SUPPORT_MESSAGES;
    }
  },

  sendSupportMessage(
    shopSlug: string, 
    text: string, 
    sender: 'shop_owner' | 'platform_hq', 
    senderName?: string
  ): SupportMessage {
    const cleanSlug = (shopSlug || 'of').toLowerCase().trim();
    const allMessages = this.getSupportMessages();
    const defaultSenderName = sender === 'platform_hq' ? 'Platform HQ' : 'Shop Owner';
    
    const newMessage: SupportMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      shopSlug: cleanSlug,
      sender,
      senderName: senderName || defaultSenderName,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      readByHq: sender === 'platform_hq',
      readByShop: sender === 'shop_owner'
    };
    const updated = [...allMessages, newMessage];
    localStorage.setItem(SUPPORT_MESSAGES_KEY, JSON.stringify(updated));
    broadcastSystemEvent('support_messages_updated', { shopSlug: cleanSlug, message: newMessage });
    return newMessage;
  },

  markSupportMessagesRead(shopSlug: string, reader: 'hq' | 'shop') {
    const cleanSlug = (shopSlug || 'of').toLowerCase().trim();
    const allMessages = this.getSupportMessages();
    let changed = false;
    const updated = allMessages.map(m => {
      if ((m.shopSlug || '').toLowerCase().trim() === cleanSlug) {
        if (reader === 'hq' && !m.readByHq) {
          changed = true;
          return { ...m, readByHq: true };
        }
        if (reader === 'shop' && !m.readByShop) {
          changed = true;
          return { ...m, readByShop: true };
        }
      }
      return m;
    });
    if (changed) {
      localStorage.setItem(SUPPORT_MESSAGES_KEY, JSON.stringify(updated));
      broadcastSystemEvent('support_messages_updated', { shopSlug: cleanSlug });
    }
  },

  getUnreadSupportCount(reader: 'hq' | 'shop', shopSlug?: string): number {
    const messages = this.getSupportMessages(shopSlug);
    if (reader === 'hq') {
      return messages.filter(m => !m.readByHq && m.sender === 'shop_owner').length;
    } else {
      return messages.filter(m => !m.readByShop && m.sender === 'platform_hq').length;
    }
  },

  // -------------------------------------------------------------
  // 💳 PLATFORM SUBSCRIPTION BILLING ACTIONS (For Platform HQ)
  // -------------------------------------------------------------

  markShopSubscriptionPaid(slug: string, paymentMethod: SubscriptionPaymentMethod = 'stripe'): Shop {
    const today = new Date().toISOString().split('T')[0];
    
    // Compute next billing date (30 days ahead)
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);
    const nextBilling = nextDate.toISOString().split('T')[0];

    const updated = this.updateShop(slug, {
      subscriptionStatus: 'active',
      subscriptionLastPaidDate: today,
      subscriptionNextBillingDate: nextBilling,
      subscriptionPaymentMethod: paymentMethod
    });

    return updated;
  }
};
