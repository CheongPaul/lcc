import { firebaseConfig, vapidKey } from './firebase-config.js';

const preference = 'lcc-pom-push';
const schedulePreference = 'lcc-schedule-push';
const settingsButton = document.createElement('button');
settingsButton.type = 'button';
settingsButton.className = 'settings-button';
settingsButton.setAttribute('aria-labelledby', 'settings-button-label');
settingsButton.setAttribute('aria-haspopup', 'dialog');
settingsButton.setAttribute('aria-controls', 'lcc-settings');
settingsButton.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m9 3-.6 2.2-1.8 1L4.4 6l-2 3.5L4 11v2l-1.6 1.5 2 3.5 2.2-.2 1.8 1L9 21h6l.6-2.2 1.8-1 2.2.2 2-3.5L20 13v-2l1.6-1.5-2-3.5-2.2.2-1.8-1L15 3Z"/><circle cx="12" cy="12" r="3.3"/></svg><span id="settings-button-label" class="settings-sr-only">Settings</span>';
const settingsDesktop = matchMedia('(min-width: 761px)');
function positionSettingsButton() {
  const target = document.querySelector(settingsDesktop.matches ? '.asidebottom' : '.header-actions');
  if (target && settingsButton.parentElement !== target) target.append(settingsButton);
}
positionSettingsButton();
settingsDesktop.addEventListener('change', positionSettingsButton);
const settings = document.createElement('dialog');
settings.id = 'lcc-settings';
settings.className = 'settings-dialog';
settings.setAttribute('aria-labelledby', 'settings-title');
settings.innerHTML = '<h2 id="settings-title">Settings</h2><div class="settings-row"><div><strong id="schedule-push-label">Next match schedule alerts</strong><p>Schedule updates and reminders before the next match.</p></div><button type="button" class="push-switch" id="schedule-push-toggle" role="switch" aria-labelledby="schedule-push-label" aria-describedby="push-status"></button></div><div class="settings-row"><div><strong id="push-label">POM notifications</strong><p>New match POM alerts on this device.</p></div><button type="button" class="push-switch" id="push-toggle" role="switch" aria-labelledby="push-label" aria-describedby="push-status"></button></div><p id="push-status" class="settings-status" role="status"></p><button type="button" class="btn settings-close">Close</button>';
document.body.append(settings);
settingsButton.addEventListener('click', () => settings.showModal());
settings.querySelector('.settings-close').addEventListener('click', () => settings.close());
settings.addEventListener('close', () => settingsButton.focus());
settings.addEventListener('click', event => {
  if (event.target !== settings) return;
  const rect = settings.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) settings.close();
});
const buttons = {pom:settings.querySelector('#push-toggle'),schedule:settings.querySelector('#schedule-push-toggle')};
const status = settings.querySelector('#push-status');
let preferences = {pom:localStorage.getItem(preference) === 'on',schedule:localStorage.getItem(schedulePreference) === 'on'};
let busy = false, sdkPromise;
const copy = {
  off: 'Choose which notifications to receive on this device.',
  on: 'Notification preferences are saved for this device. Delivery may be delayed.',
  busy: 'Updating notification settings…',
  ios: 'On iPhone or iPad, add LCC to your home screen and open it there first.',
  unsupported: 'Push notifications are not supported in this browser.',
  denied: 'Notifications are blocked. Allow them in your device or browser settings.',
  setup: 'Schedule alerts require updated Firebase rules. Existing POM alerts remain available.',
  error: 'Could not update notifications. Check your connection and try again.'
};
function render(message = preferences.pom || preferences.schedule ? 'on' : 'off') {
  // Replace text nodes so the existing translation observer receives fresh English source.
  for (const [kind,button] of Object.entries(buttons)) {
    button.textContent = preferences[kind] ? 'ON' : 'OFF';
    button.disabled = busy;
    button.setAttribute('aria-checked', String(preferences[kind]));
    button.setAttribute('aria-busy', String(busy));
  }
  status.textContent = copy[message];
}
function persistPreferences(next) {
  preferences = {...next};
  for (const [kind,key] of [['pom',preference],['schedule',schedulePreference]]) {
    if (next[kind]) localStorage.setItem(key,'on'); else localStorage.removeItem(key);
  }
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
async function subscribe(next, refresh = false) {
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
  const old = previous.exists() ? previous.data() : null;
  if (refresh && old) next = {pom:old.pomEnabled !== false,schedule:old.scheduleEnabled === true};
  // Legacy POM-only subscriptions keep working until the owner publishes the expanded rules.
  const modern = next.schedule || old?.pomEnabled !== undefined || old?.scheduleEnabled !== undefined;
  await sdk.db.setDoc(ref, {
    token, language: document.documentElement.lang === 'ko' ? 'ko' : 'en',
    createdAt:previous.exists() ? previous.data().createdAt : sdk.db.serverTimestamp(),
    updatedAt:sdk.db.serverTimestamp(),
    ...(modern ? {pomEnabled:next.pom,scheduleEnabled:next.schedule} : {})
  });
  persistPreferences(next);
}
async function unsubscribe() {
  const sdk = await loadSDK();
  const user = await identity(sdk);
  // Stop server targeting first; never claim success while the subscription still exists.
  await sdk.db.deleteDoc(sdk.db.doc(sdk.store, 'pushSubscriptions', user.uid));
  await sdk.messaging.deleteToken(sdk.messenger);
  persistPreferences({pom:false,schedule:false});
}
function errorMessage(error) {
  const code = String(error?.code || '');
  if (code === 'unsupported') return 'unsupported';
  if (code === 'setup' || /permission-denied|operation-not-allowed|configuration-not-found/.test(code)) return 'setup';
  if (Notification.permission === 'denied') return 'denied';
  return 'error';
}
for (const [kind,button] of Object.entries(buttons)) button.addEventListener('click', async () => {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios && !(navigator.standalone || matchMedia('(display-mode: standalone)').matches)) return render('ios');
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !window.isSecureContext) return render('unsupported');
  // Must be invoked directly from the tap, before dynamic imports/network requests (iOS).
  const next = {...preferences,[kind]:!preferences[kind]};
  const permission = next[kind] && Notification.permission !== 'granted' ? Notification.requestPermission() : Promise.resolve('granted');
  busy = true; render('busy');
  let message;
  try {
    if (await permission !== 'granted') message = 'denied';
    else if (!next.pom && !next.schedule) await unsubscribe();
    else await subscribe(next);
  } catch (error) { message = errorMessage(error); }
  finally { busy = false; render(message); }
});
render();
// Renew tokens only on devices that explicitly opted in; never ask permission on load.
if ((preferences.pom || preferences.schedule) && 'Notification' in window) {
  busy = true; render('busy');
  const refresh = Notification.permission === 'granted' ? subscribe(preferences, true) : unsubscribe();
  refresh.then(() => {busy = false; render();}).catch(error => {busy = false; render(errorMessage(error));});
}
