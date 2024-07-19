import { precacheAndRoute } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope

self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? {}
  const title = data.title || 'New Notification'
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/sentinel_logo.png',
    badge: '/sentinel_logo.png'
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  // Add custom behavior when notification is clicked
  // For example, open a specific page of your app
  clients.openWindow('/')
})

// Use the imported precacheAndRoute method to set up precaching
precacheAndRoute(self.__WB_MANIFEST)