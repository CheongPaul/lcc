import { firebaseConfig, vapidKey } from './firebase-config.js';

const preference = 'lcc-pom-push';
const settingsButton = document.createElement('button');
settingsButton.type = 'button';
settingsButton.className = 'settings-button';
settingsButton.setAttribute('aria-labelledby', 'settings-button-label');
settingsButton.setAttribute('aria-haspopup', 'dialog');
settingsButton.setAttribute('aria-controls', 'lcc-settings');
settingsButton.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m9 3-.6 2.2-1.8 1L4.4 6l-2 3.5L4 11v2l-1.6 1.5 2 3.5 2.2-.2 1.8 1L9 21h6l.6-2.2 1.8-1 2.2.2 2-3.5L20 13v-2l1.6-1.5-2-3.5-2.2.2-1.8-1L15 3Z"/><circle cx="12" cy="12" r="3.3"/></svg><span id="settings-button-label" class="settings-sr-only">Settings</span>';
document.querySelector('.header-actions').append(settingsButton);
const settings = document.createElement('dialog');
settings.id = 'lcc-settings';
settings.className = 'settings-dialog';
settings.setAttribute('aria-labelledby', 'settings-title');
settings.innerHTML = '<h2 id="settings-title">Settings</h2><div class="settings-row"><div><strong id="push-label">POM notifications</strong><p>New match POM alerts on this device.</p></div><button type="button" class="push-switch" id="push-toggle" role="switch" aria-labelledby="push-label" aria-describedby="push-status"></button></div><p id="push-status" class="settings-status" role="status"></p><button type="button" class="btn settings-close">Close</button>';
document.body.append(settings);
settingsButton.addEventListener('click', () => settings.showModal());
settings.querySelector('.settings-close').addEventListener('click', () => settings.close());
settings.addEventListener('close', () => settingsButton.focus());
settings.addEventListener('click', event => {
  if (event.target !== settings) return;
  const rect = settings.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) settings.close();
});
const button = settings.querySelector('#push-toggle'), status = settings.querySelector('#push-status');
let enabled = localStorage.getItem(preference) === 'on', busy = false, sdkPromise;
const copy = {
  off: 'Get a notification when a new match POM is announced.',
  on: 'POM alerts are on for this device. Delivery may be delayed.',
  busy: 'Updating notification settings…',
  ios: 'On iPhone or iPad, add LCC to your home screen and open it there first.',
  unsupported: 'Push notifications are not supported in this browser.',
  denied: 'Notifications are blocked. Allow them in your device or browser settings.',
  setup: 'POM notifications are awaiting Firebase setup. Please try again later.',
  error: 'Could not update notifications. Check your connection and try again.'
};
function render(message = enabled ? 'on' : 'off') {
  // Replace text nodes so the existing translation observer receives fresh English source.
  button.textContent = enabled ? 'ON' : 'OFF';
  button.disabled = busy;
  button.setAttribute('aria-checked', String(enabled));
  button.setAttribute('aria-busy', String(busy));
  status.textContent = copy[message];
}
function loadSDK() {
  if (!sdkPromise) sdkPromise = Promise.all([
    import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js'),
    import('https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging.js')
  ]).then(async ([core, auth, db, messaging]) => {
    if (!await messaging.isSupported()) throw {code:'unsupported'};
    const app = core.initializeApp(firebaseConfig, 'lcc-push');
    const messenger = messaging.getMessaging(app);
    messaging.onMessage(messenger, async payload => {
      if (document.visibilityState !== 'visible' || !document.hasFocus()) return;
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({type:'LCC_SHOW_POM',payload:payload.data});
    });
    return {auth, db, messaging, userAuth:auth.getAuth(app), store:db.getFirestore(app), messenger};
  }).catch(error => { sdkPromise = null; throw error; });
  return sdkPromise;
}
async function identity(sdk) {
  await sdk.userAuth.authStateReady();
  return sdk.userAuth.currentUser || (await sdk.auth.signInAnonymously(sdk.userAuth)).user;
}
async function subscribe() {
  const sdk = await loadSDK();
  const config = await sdk.db.getDoc(sdk.db.doc(sdk.store, 'pushPublic', 'status'));
  if (!config.exists() || config.data().enabled !== true) throw {code:'setup'};
  const user = await identity(sdk);
  const registration = await navigator.serviceWorker.register('./sw.js', {scope:'./',updateViaCache:'none'});
  await navigator.serviceWorker.ready;
  const token = await sdk.messaging.getToken(sdk.messenger, {vapidKey, serviceWorkerRegistration:registration});
  if (!token) throw {code:'setup'};
  const ref = sdk.db.doc(sdk.store, 'pushSubscriptions', user.uid);
  const previous = await sdk.db.getDoc(ref);
  await sdk.db.setDoc(ref, {
    token, language: document.documentElement.lang === 'ko' ? 'ko' : 'en',
    createdAt:previous.exists() ? previous.data().createdAt : sdk.db.serverTimestamp(),
    updatedAt:sdk.db.serverTimestamp()
  });
  localStorage.setItem(preference, 'on'); enabled = true;
}
async function unsubscribe() {
  const sdk = await loadSDK();
  const user = await identity(sdk);
  // Stop server targeting first; never claim success while the subscription still exists.
  await sdk.db.deleteDoc(sdk.db.doc(sdk.store, 'pushSubscriptions', user.uid));
  await sdk.messaging.deleteToken(sdk.messenger);
  localStorage.removeItem(preference); enabled = false;
}
function errorMessage(error) {
  const code = String(error?.code || '');
  if (code === 'unsupported') return 'unsupported';
  if (code === 'setup' || /permission-denied|operation-not-allowed|configuration-not-found/.test(code)) return 'setup';
  if (Notification.permission === 'denied') return 'denied';
  return 'error';
}
button.addEventListener('click', async () => {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios && !(navigator.standalone || matchMedia('(display-mode: standalone)').matches)) return render('ios');
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !window.isSecureContext) return render('unsupported');
  // Must be invoked directly from the tap, before dynamic imports/network requests (iOS).
  const permission = !enabled ? Notification.requestPermission() : Promise.resolve('granted');
  busy = true; render('busy');
  let message;
  try {
    if (await permission !== 'granted') message = 'denied';
    else if (enabled) await unsubscribe();
    else await subscribe();
  } catch (error) { message = errorMessage(error); }
  finally { busy = false; render(message); }
});
render();
// Renew tokens only on devices that explicitly opted in; never ask permission on load.
if (enabled && 'Notification' in window) {
  busy = true; render('busy');
  const refresh = Notification.permission === 'granted' ? subscribe() : unsubscribe();
  refresh.then(() => {busy = false; render();}).catch(error => {busy = false; render(errorMessage(error));});
}
