function pomNotification(data) {
  if (data?.kind === 'schedule') {
    if (data.season !== '26-27' || !/^\d{13}-(3|5)$/.test(data.scheduleId || '')) return null;
    const url = new URL('./?season=26-27#overview', self.registration.scope);
    return {title:String(data.title || 'LCC · Next match').slice(0,120),options:{
      body:String(data.body || '').slice(0,300),icon:new URL('images/app/icon-192.png',self.registration.scope).href,
      tag:'lcc-schedule-'+data.scheduleId,renotify:false,data:{url:url.href}
    }};
  }
  if (!data || !/^\d{8}$/.test(data.match || '') || data.season !== '26-27') return null;
  const url = new URL('./', self.registration.scope);
  url.searchParams.set('season', data.season);
  url.hash = 'match/' + data.match;
  return {
    title: String(data.title || 'LCC · POM').slice(0, 120),
    options: {
      body:String(data.body || '').slice(0, 300),
      icon:new URL('images/app/icon-192.png', self.registration.scope).href,
      tag:`lcc-pom-${data.season}-${data.match}`, renotify:false,
      data:{url:url.href}
    }
  };
}
function showPom(data) {
  const notification = pomNotification(data);
  if (notification) return self.registration.showNotification(notification.title, notification.options);
  return Promise.resolve();
}
// Register before Firebase's click handler, as recommended by Firebase.
self.addEventListener('notificationclick', event => {
  if (!/^lcc-(pom|schedule)-/.test(event.notification.tag || '')) return;
  event.stopImmediatePropagation();
  event.notification.close();
  const url = new URL(event.notification.data?.url || './', self.registration.scope);
  if (!url.href.startsWith(self.registration.scope)) return;
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for (const client of clients) {
      if (client.url.startsWith(self.registration.scope) && 'navigate' in client) {
        await client.navigate(url.href); return client.focus();
      }
    }
    return self.clients.openWindow(url.href);
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'LCC_SHOW_POM' && event.source?.url?.startsWith(self.registration.scope)) {
    event.waitUntil(showPom(event.data.payload));
  }
});
importScripts('https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey:'AIzaSyCHec4PkzCYNfYn9nrRbJ6hVLaNhDKA6Yo',
  projectId:'lccstats', messagingSenderId:'76567286678',
  appId:'1:76567286678:web:d032bf66f57f4ac38043b7'
});
firebase.messaging().onBackgroundMessage(payload => showPom(payload.data));
