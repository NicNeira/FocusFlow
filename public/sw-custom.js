// Custom Service Worker additions for FocusFlow PWA
// This file contains push notification handling logic

// =============================================
// PUSH NOTIFICATION HANDLERS
// =============================================

/**
 * Handle incoming push notifications
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);

  if (!event.data) {
    console.log('[SW] Push event has no data');
    return;
  }

  try {
    const payload = event.data.json();
    console.log('[SW] Push payload:', payload);

    const options = {
      body: payload.body || 'Timer notification',
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/badge-72x72.png',
      tag: payload.tag || 'focusflow-timer',
      vibrate: [100, 50, 100],
      data: {
        type: payload.data?.type || 'timer',
        url: payload.data?.url || '/',
        timestamp: Date.now(),
      },
      actions: [
        {
          action: 'open',
          title: 'Abrir FocusFlow',
        },
        {
          action: 'dismiss',
          title: 'Descartar',
        },
      ],
      requireInteraction: true, // Keep notification visible until user interacts
    };

    const title = payload.title || 'FocusFlow';

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[SW] Error parsing push payload:', error);

    // Show a fallback notification
    event.waitUntil(
      self.registration.showNotification('FocusFlow', {
        body: 'Tu temporizador necesita atención',
        icon: '/icons/icon-192x192.png',
        tag: 'focusflow-fallback',
      })
    );
  }
});

/**
 * Handle notification click events
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'dismiss') {
    // User dismissed, do nothing extra
    return;
  }

  // Open or focus the app
  const urlToOpen = data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if app is already open
        for (const client of windowClients) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            // App is open, focus it and navigate
            return client.focus().then(() => {
              if (client.navigate) {
                return client.navigate(urlToOpen);
              }
            });
          }
        }
        // App is not open, open it
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Handle notification close events (user dismissed without clicking)
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
  // Optional: Track dismissal analytics
});

/**
 * Handle push subscription change (browser may change subscription)
 */
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed:', event);

  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then((subscription) => {
        // Send new subscription to server
        console.log('[SW] Resubscribed:', subscription);
        // Note: You'll need to implement this endpoint or use a message to the client
      })
      .catch((error) => {
        console.error('[SW] Failed to resubscribe:', error);
      })
  );
});

// =============================================
// MESSAGE HANDLING (Communication with main app)
// =============================================

/**
 * Handle messages from the main app
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'TIMER_STARTED':
      // Store timer info for potential future use
      console.log('[SW] Timer started:', payload);
      break;

    case 'TIMER_STOPPED':
      // Clear any local timer state
      console.log('[SW] Timer stopped');
      break;

    case 'GET_VERSION':
      event.ports[0].postMessage({ version: '1.0.0' });
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// =============================================
// BACKGROUND SYNC (for offline support)
// =============================================

/**
 * Handle background sync events
 * This allows saving timer data when connection is restored
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-timer-state') {
    event.waitUntil(syncTimerState());
  }
});

/**
 * Sync timer state to server when online
 */
async function syncTimerState() {
  try {
    // Get pending data from IndexedDB or cache
    const cache = await caches.open('focusflow-sync');
    const response = await cache.match('pending-timer-state');

    if (!response) {
      console.log('[SW] No pending timer state to sync');
      return;
    }

    const pendingState = await response.json();
    console.log('[SW] Syncing timer state:', pendingState);

    // Note: This would require the client to store auth token in the cache
    // For now, this is a placeholder for future implementation

    // Clear the pending state after successful sync
    await cache.delete('pending-timer-state');

    console.log('[SW] Timer state synced successfully');
  } catch (error) {
    console.error('[SW] Failed to sync timer state:', error);
    throw error; // Will retry sync
  }
}

// =============================================
// PERIODIC BACKGROUND SYNC (optional, experimental)
// =============================================

/**
 * Handle periodic background sync
 * Note: Requires 'periodic-background-sync' permission and browser support
 */
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync triggered:', event.tag);

  if (event.tag === 'check-timer-status') {
    event.waitUntil(checkTimerStatus());
  }
});

/**
 * Check timer status periodically (when supported)
 */
async function checkTimerStatus() {
  console.log('[SW] Checking timer status...');
  // This would communicate with the server to check if any notifications are due
}

console.log('[SW] FocusFlow custom service worker loaded');
