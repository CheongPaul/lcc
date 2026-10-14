(() => {
  let installPrompt = null;
  const standalone = matchMedia('(display-mode: standalone)');
  const installed = () => standalone.matches || navigator.standalone === true;
  const banner = document.getElementById('pwa-install-bar');
  const dialog = document.getElementById('pwa-install-dialog');
  const button = document.getElementById('pwa-install');
  const sync = () => { banner.hidden = installed(); };
  sync();
  standalone.addEventListener?.('change',sync);
  addEventListener('beforeinstallprompt',event => {
    event.preventDefault(); installPrompt = event; sync();
  });
  addEventListener('appinstalled',() => {
    installPrompt = null; banner.hidden = true;
    if(dialog.open)dialog.close();
  });
  button.addEventListener('click',async () => {
    if(installPrompt){
      const prompt=installPrompt;installPrompt=null;
      try{await prompt.prompt();await prompt.userChoice;return;}catch{}
    }
    dialog.showModal();
  });
  document.getElementById('pwa-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  if('serviceWorker' in navigator && window.isSecureContext){
    navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'})
      .catch(error=>console.warn('LCC offline help unavailable:',error));
  }
})();
