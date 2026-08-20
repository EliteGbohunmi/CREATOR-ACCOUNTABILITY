import { getVapidKey, registerPushSubscription } from './backend';

export async function subscribeToPush(userId: string) {
  alert('1️⃣ subscribeToPush called for user: ' + userId);
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('❌ Push not supported');
    return;
  }

  const permission = await Notification.requestPermission();
  alert('2️⃣ Permission: ' + permission);
  if (permission !== 'granted') {
    alert('❌ Permission denied');
    return;
  }

  let registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    alert('3️⃣ Registering SW...');
    registration = await navigator.serviceWorker.register('/sw.js');
  }
  alert('4️⃣ SW registered: ' + (registration ? 'yes' : 'no'));

  const publicKey = await getVapidKey();
  alert('5️⃣ VAPID key: ' + (publicKey ? 'received' : 'empty'));
  if (!publicKey) {
    alert('❌ No VAPID key');
    return;
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey
    });
    alert('6️⃣ Subscribed! Endpoint: ' + subscription.endpoint.slice(0, 30) + '...');

    await registerPushSubscription(userId, subscription);
    alert('✅ Subscription saved to backend!');
  } catch (err) {
    alert('❌ Subscription error: ' + (err as Error).message);
  }
}
