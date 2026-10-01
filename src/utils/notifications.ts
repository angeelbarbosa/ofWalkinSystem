// Notification & Device Vibration System for Barber Alerts

const DEVICE_BARBER_KEY = 'of_device_barber_id';

export interface ArrivalToastEventData {
  clientName: string;
  barberName: string;
  appointmentTime?: string;
  barberId?: string;
  timestamp: string;
}

export class NotificationManager {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private channel: BroadcastChannel | null = null;
  private recentlyAlerted = new Set<string>();

  constructor() {
    this.initServiceWorker();
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('barber_checkin_channel');
      } catch (e) {
        console.warn('BroadcastChannel not supported or restricted:', e);
      }
    }
  }

  async initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const existing = await navigator.serviceWorker.getRegistration();
      if (existing) {
        this.swRegistration = existing;
        return existing;
      }
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      return this.swRegistration;
    } catch (e) {
      console.warn('Service worker registration failed:', e);
      return null;
    }
  }

  getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('This browser does not support Web Push notifications.');
      return false;
    }

    try {
      // Ensure SW is initialized before requesting permission
      await this.initServiceWorker();
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch {
      return false;
    }
  }

  // Device Barber Association (e.g. Angel's phone vs All Barbers)
  getMyBarberPreference(): string {
    if (typeof window === 'undefined') return 'all';
    return localStorage.getItem(DEVICE_BARBER_KEY) || 'all';
  }

  setMyBarberPreference(barberIdOrName: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEVICE_BARBER_KEY, barberIdOrName);
    }
  }

  isForThisDevice(barberName?: string, barberId?: string): boolean {
    const myBarberPref = (this.getMyBarberPreference() || 'all').trim().toLowerCase();
    if (myBarberPref === 'all' || myBarberPref === '') return true;

    const targetName = (barberName || '').trim().toLowerCase();
    const targetId = (barberId || '').trim().toLowerCase();

    return (
      myBarberPref === targetName ||
      myBarberPref === targetId ||
      (targetName.length > 0 && targetName.includes(myBarberPref)) ||
      (myBarberPref.length > 0 && targetName.includes(myBarberPref)) ||
      (targetId.length > 0 && targetId === myBarberPref)
    );
  }

  // Vibrate mobile device (if supported)
  vibratePhone(pattern: number[] = [300, 150, 300, 150, 500]) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore if vibrate is restricted
      }
    }
  }

  // Trigger alert locally on this browser / device
  async triggerLocalAlert(clientName: string, barberName: string, appointmentTime?: string, barberId?: string) {
    if (!this.isForThisDevice(barberName, barberId)) {
      return;
    }

    // Deduplicate rapid duplicate alerts (within 5 seconds)
    const alertKey = `${clientName}-${barberName}-${appointmentTime}`;
    if (this.recentlyAlerted.has(alertKey)) {
      return;
    }
    this.recentlyAlerted.add(alertKey);
    setTimeout(() => this.recentlyAlerted.delete(alertKey), 5000);

    // 1. Phone vibration
    this.vibratePhone();

    // 2. Dispatch in-app visual toast event
    if (typeof window !== 'undefined') {
      const toastData: ArrivalToastEventData = {
        clientName,
        barberName,
        appointmentTime,
        barberId,
        timestamp: new Date().toISOString()
      };
      window.dispatchEvent(new CustomEvent('barber_arrival_toast', { detail: toastData }));
    }

    // 3. Web Push / OS Lockscreen Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const title = `🔔 ${clientName} is here for ${barberName || 'you'}!`;
      const body = appointmentTime 
        ? `Appointment at ${appointmentTime} • Waiting in lobby.` 
        : `Arrival • Waiting in lobby.`;

      try {
        let reg = this.swRegistration;
        if (!reg && 'serviceWorker' in navigator) {
          reg = await navigator.serviceWorker.ready;
        }

        if (reg && 'showNotification' in reg) {
          await reg.showNotification(title, {
            body,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: `arrival-${Date.now()}`,
            data: { url: '/?portal=barber' }
          });
        } else {
          new Notification(title, {
            body,
            icon: '/logo.png'
          });
        }
      } catch (e) {
        console.warn('Could not display push notification:', e);
      }
    }
  }

  // Broadcast check-in arrival across all devices & tabs
  async sendBarberArrivalAlert(clientName: string, barberName: string, appointmentTime?: string, barberId?: string) {
    // 1. Broadcast to other tabs/windows in real time
    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'NEW_CHECKIN',
          clientName,
          barberName,
          barberId,
          appointmentTime,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        console.warn('BroadcastChannel postMessage failed:', e);
      }
    }

    // 2. Trigger local alert for this device
    await this.triggerLocalAlert(clientName, barberName, appointmentTime, barberId);
  }

  onMessage(callback: (data: any) => void) {
    if (this.channel) {
      this.channel.onmessage = (event) => callback(event.data);
    }
  }
}

export const notificationManager = new NotificationManager();

