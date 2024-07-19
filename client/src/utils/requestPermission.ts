import { toast } from "react-toastify";

export const requestNotificationPermission = async () => {
    if ('Notification' in window && navigator.serviceWorker) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          toast('Notification permission granted', {
            position: "top-right",
            autoClose: 2000,
            theme: "light",
            type: "success"
        })
        } else {
          console.log('Notification permission denied.');
          toast('Notification permission denied.', {
            position: "top-right",
            autoClose: 2000,
            theme: "light",
            type: "error"
        })
        }
      } catch (error) {
        console.error('Error requesting notification permission', error);
      }
    }
};
  