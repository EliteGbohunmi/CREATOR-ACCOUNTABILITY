import { getVapidKey, registerPushSubscription } from './backend';

export async function subscribeToPush(userId: string) {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push not supported in this browser');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('Notification permission denied');
    return;
  }

  let registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    registration = await navigator.serviceWorker.register('/sw.js');
  }

  const publicKey = await getVapidKey();
  if (!publicKey) {
    console.warn('No VAPID public key – push disabled');
    return;
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey
    });
    await registerPushSubscription(userId, subscription);
    console.log('✅ Push subscription saved');
  } catch (err) {
    console.error('❌ Subscription error:', err);
  }
}
