(() => {
  const APP_NAME = 'Kanye Series';
  const SW_PATH = './service-worker.js';
  const INSTALL_DISMISSAL_KEY = 'kanye-install-dismissed-until';

  const isAppInstalled = () => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    const navigatorStandalone = window.navigator.standalone === true;
    const isInstalled = standalone || navigatorStandalone;
    return isInstalled;
  };

  const createInstallPrompt = () => {
    if (document.getElementById('kanye-install-button')) {
      return document.getElementById('kanye-install-button');
    }

    const button = document.createElement('div');
    button.id = 'kanye-install-button';
    button.setAttribute('role', 'region');
    button.setAttribute('aria-label', `Install ${APP_NAME}`);
    button.className = 'fixed bottom-5 left-1/2 z-50 hidden w-[min(92vw,26rem)] -translate-x-1/2 flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-[0_2rem_3rem_rgba(15,23,42,0.18)] transition-all duration-300 md:left-auto md:right-5 md:translate-x-0';
    button.hidden = true;
    button.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-900 text-lg text-white">
            <i class="bi bi-download"></i>
          </div>
          <div>
            <div class="text-base font-black text-slate-900">Install app</div>
            <div class="text-xs font-medium text-slate-500">Add Kanye Series to your home screen</div>
          </div>
        </div>
        <button type="button" data-install-dismiss aria-label="Dismiss install prompt" class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="flex items-center justify-end gap-2">
        <button type="button" data-install-dismiss class="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Later</button>
        <button type="button" data-install-action class="rounded-xl bg-blue-900 px-3 py-2 text-xs font-bold text-white">Install</button>
      </div>
    `;
    document.body.appendChild(button);
    return button;
  };

  const createNetworkStatus = () => {
    if (document.getElementById('kanye-network-status')) {
      return document.getElementById('kanye-network-status');
    }

    const status = document.createElement('div');
    status.id = 'kanye-network-status';
    status.className = 'fixed left-1/2 top-4 z-[60] hidden -translate-x-1/2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg backdrop-blur';
    status.setAttribute('role', 'status');
    document.body.appendChild(status);
    return status;
  };

  const getManifestConfig = async () => {
    try {
      const response = await fetch('./manifest.json', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Manifest fetch failed');
      }

      const manifest = await response.json();
      return manifest?.splash || {};
    } catch (error) {
      console.info('[PWA] Using default splash config.', error);
      return {};
    }
  };

  const createSplashScreen = (splashConfig = {}) => {
    if (document.getElementById('kanye-splash-screen')) {
      return document.getElementById('kanye-splash-screen');
    }

    const backgroundColor = splashConfig.background_color || '#f8fafc';
    const textColor = splashConfig.text_color || '#1e3a8a';
    const logoPath = splashConfig.logo || './images/logo.png';
    const title = splashConfig.title || 'Kanye Series';

    const splash = document.createElement('div');
    splash.id = 'kanye-splash-screen';
    splash.className = 'fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500';
    splash.style.backgroundColor = backgroundColor;
    splash.innerHTML = `
      <div class="flex flex-col items-center gap-4 text-center">
        <div class="flex h-24 w-24 items-center justify-center rounded-2xl bg-blue-900 shadow-lg shadow-blue-900/20">
          <img src="${logoPath}" alt="${title} logo" class="h-16 w-16 object-contain" />
        </div>
        <div>
          <p class="text-xl font-black uppercase tracking-[0.25em]" style="color: ${textColor};">Kanye</p>
          <p class="text-sm font-semibold tracking-[0.35em]" style="color: ${textColor}; opacity: 0.7;">Series</p>
        </div>
        <div class="h-1.5 w-28 overflow-hidden rounded-full bg-blue-100">
          <div class="h-full w-full -translate-x-full rounded-full bg-blue-900 animate-[pulse_1.2s_ease-in-out_infinite]" style="animation: pulse 1.2s ease-in-out infinite;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(splash);
    document.body.style.overflow = 'hidden';
    return splash;
  };

  const hideSplashScreen = () => {
    const splash = document.getElementById('kanye-splash-screen');
    if (!splash) {
      document.body.style.overflow = '';
      return;
    }

    splash.classList.add('opacity-0');
    window.setTimeout(() => {
      splash.remove();
      document.body.style.overflow = '';
    }, 500);
  };

  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register(SW_PATH, {
        scope: './',
        updateViaCache: 'none'
      });

      if (registration.waiting) {
        handleServiceWorkerUpdate(registration);
      }

      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            handleServiceWorkerUpdate(registration);
          }
        });
      });

      let shouldReloadForUpdate = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (shouldReloadForUpdate) window.location.reload();
      });
      registration.__reloadAfterUpdate = () => { shouldReloadForUpdate = true; };
    } catch (error) {
      console.warn('[PWA] Service worker registration failed:', error);
    }
  };

  const handleServiceWorkerUpdate = (registration) => {
    const awaiting = registration.waiting;
    if (!awaiting) return;

    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Update available',
        text: 'A new version of Kanye Series is ready. Update now?',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Update',
        cancelButtonText: 'Later',
        confirmButtonColor: '#1e3a8a',
        reverseButtons: true,
        allowOutsideClick: false
      }).then((result) => {
        if (!result.isConfirmed) return;

        registration.__reloadAfterUpdate?.();
        awaiting.postMessage({ type: 'SKIP_WAITING' });
        awaiting.addEventListener('statechange', () => {
          if (awaiting.state === 'activated') {
            window.location.reload();
          }
        });
      });
    }
  };

  const setupInstallPrompt = () => {
    const installButton = createInstallPrompt();
    if (!installButton) return;
    const installAction = installButton.querySelector('[data-install-action]');
    const dismissActions = installButton.querySelectorAll('[data-install-dismiss]');

    let deferredPrompt = null;

    const hideInstallButton = () => {
      installButton.classList.add('hidden');
      installButton.hidden = true;
      installButton.setAttribute('aria-hidden', 'true');
    };

    const showInstallButton = () => {
      const dismissedUntil = Number(localStorage.getItem(INSTALL_DISMISSAL_KEY) || 0);
      if (isAppInstalled() || dismissedUntil > Date.now()) {
        hideInstallButton();
        return;
      }

      installButton.classList.remove('hidden');
      installButton.hidden = false;
      installButton.setAttribute('aria-hidden', 'false');
    };

    const syncInstallButtonState = () => {
      if (isAppInstalled()) {
        hideInstallButton();
        return;
      }

      if (deferredPrompt) {
        showInstallButton();
      } else {
        hideInstallButton();
      }
    };

    if (isAppInstalled()) {
      hideInstallButton();
    }

    const standaloneMedia = window.matchMedia ? window.matchMedia('(display-mode: standalone)') : null;
    if (standaloneMedia && typeof standaloneMedia.addEventListener === 'function') {
      standaloneMedia.addEventListener('change', syncInstallButtonState);
    } else if (standaloneMedia && typeof standaloneMedia.addListener === 'function') {
      standaloneMedia.addListener(syncInstallButtonState);
    }

    const mobileViewport = window.matchMedia ? window.matchMedia('(max-width: 767px)') : null;
    if (mobileViewport && typeof mobileViewport.addEventListener === 'function') {
      mobileViewport.addEventListener('change', syncInstallButtonState);
    } else if (mobileViewport && typeof mobileViewport.addListener === 'function') {
      mobileViewport.addListener(syncInstallButtonState);
    }

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      if (isAppInstalled()) {
        deferredPrompt = null;
        hideInstallButton();
        return;
      }

      deferredPrompt = event;
      syncInstallButtonState();
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      hideInstallButton();
      console.info('[PWA] App installed successfully.');
    });

    installAction?.addEventListener('click', async () => {
      if (!deferredPrompt) {
        hideInstallButton();
        return;
      }

      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        console.info('[PWA] User accepted the install prompt.');
      }
      deferredPrompt = null;
      hideInstallButton();
    });

    dismissActions.forEach(action => action.addEventListener('click', () => {
      localStorage.setItem(INSTALL_DISMISSAL_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
      hideInstallButton();
    }));
  };

  const setupNetworkStatus = () => {
    const status = createNetworkStatus();
    if (!status) return;

    const setStatus = (online) => {
      const text = online ? 'You\'re back online.' : 'You are offline. Some features may be unavailable.';
      status.textContent = text;
      status.classList.remove('hidden');
      status.classList.toggle('text-emerald-700', online);
      status.classList.toggle('text-amber-700', !online);
      status.classList.toggle('border-emerald-200', online);
      status.classList.toggle('border-amber-200', !online);
      status.classList.toggle('bg-emerald-50', online);
      status.classList.toggle('bg-amber-50', !online);
      setTimeout(() => status.classList.add('hidden'), online ? 2500 : 4000);
    };

    setStatus(navigator.onLine);
    window.addEventListener('online', () => setStatus(true));
    window.addEventListener('offline', () => setStatus(false));
  };

  const setupPeriodicSync = async () => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      if (!('PeriodicSyncManager' in window) || !registration.periodicSync) {
        return;
      }

      const tags = ['refresh-public-content'];
      for (const tag of tags) {
        try {
          const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
          if (status.state === 'granted') {
            await registration.periodicSync.register(tag, { minInterval: 24 * 60 * 60 * 1000 });
          }
        } catch (error) {
          console.info('[PWA] Periodic sync unavailable or not permitted.');
        }
      }
    } catch (error) {
      console.info('[PWA] Periodic sync unavailable or not permitted.');
    }
  };

  const init = async () => {
    if (typeof Swal === 'undefined') {
      console.info('[PWA] SweetAlert2 not available, update prompt will be silent.');
    }

    const splashConfig = await getManifestConfig();
    const splashScreen = createSplashScreen(splashConfig);
    if (splashScreen) {
      window.addEventListener('load', () => {
        window.setTimeout(hideSplashScreen, 400);
      }, { once: true });

      if (document.readyState === 'complete') {
        window.setTimeout(hideSplashScreen, 400);
      }
    }

    setupNetworkStatus();
    setupInstallPrompt();
    await registerServiceWorker();
    await setupPeriodicSync();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
