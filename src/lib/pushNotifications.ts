import { getVapidKey, registerPushSubscription } from './backend';

export async function subscribeToPush(userId: string) {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push not supported');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('Permission denied');
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

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: publicKey
  });

  await registerPushSubscription(userId, subscription);
  console.log('Push subscription saved');
}
