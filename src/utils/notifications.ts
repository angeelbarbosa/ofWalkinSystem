// Notification & Device Vibration System for Barber Alerts

const DEVICE_BARBER_KEY = 'of_device_barber_id';

export class NotificationManager {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private channel: BroadcastChannel | null = null;

  constructor() {
    this.initServiceWorker();
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('barber_checkin_channel');
    }
  }

  async initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
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

  setMyBarberPreference(barberId: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEVICE_BARBER_KEY, barberId);
    }
  }

  // Vibrate mobile device (if supported)
  vibratePhone(pattern: number[] = [200, 100, 200, 100, 400]) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore if vibrate is restricted
      }
    }
  }

  // Send push notification to the barber's phone screen / lockscreen
  async sendBarberArrivalAlert(clientName: string, barberName: string, appointmentTime?: string, barberId?: string) {
    const myBarberId = this.getMyBarberPreference();
    const isTargetedToThisDevice = myBarberId === 'all' || myBarberId === barberId || myBarberId === barberName;

    // 1. Broadcast to other tabs/windows in real time
    if (this.channel) {
      this.channel.postMessage({
        type: 'NEW_CHECKIN',
        clientName,
        barberName,
        barberId,
        appointmentTime,
        timestamp: new Date().toISOString()
      });
    }

    // If this device is dedicated to another barber, skip local buzz/notification
    if (!isTargetedToThisDevice) {
      return;
    }

    // 2. Vibrate device
    this.vibratePhone();

    // 3. Trigger Web Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const title = `🔔 ${clientName} is here for you!`;
      const body = appointmentTime 
        ? `Appointment at ${appointmentTime} • Waiting in lobby.` 
        : `Arrival • Waiting in lobby.`;

      try {
        if (this.swRegistration && 'showNotification' in this.swRegistration) {
          await this.swRegistration.showNotification(title, {
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

  onMessage(callback: (data: unknown) => void) {
    if (this.channel) {
      this.channel.onmessage = (event) => callback(event.data);
    }
  }
}

export const notificationManager = new NotificationManager();
