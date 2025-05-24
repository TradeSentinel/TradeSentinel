import { toast } from "react-toastify";
import { registerFcmToken } from "./fcmTokenRegistration";
import { auth, db } from "./firebaseInit";
import { doc, updateDoc } from "firebase/firestore";

export const requestNotificationPermission = async () => {
  if ('Notification' in window && navigator.serviceWorker) {
    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        console.log('Notification permission granted by browser.');
        try {
          await registerFcmToken(); // This now throws more specific errors
          console.log('registerFcmToken reported success.');

          const user = auth.currentUser;
          if (user) {
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, { notificationsEnabled: true });
          }
          toast('Notifications enabled and registration sent to server.', { // More accurate success
            position: "top-right",
            autoClose: 2500,
            theme: "light",
            type: "success"
          });
        } catch (registrationError: any) {
          console.error('Error during FCM token registration step:', registrationError);
          // Use the message from the specific error thrown by registerFcmToken
          const displayMessage = (registrationError && registrationError.message) ?
            registrationError.message :
            'Token registration failed. Please try again.';
          toast(`Permission granted, but: ${displayMessage}`, {
            position: "top-right",
            autoClose: 4000, // Longer for error messages
            theme: "light",
            type: "warning"
          });
          // Consider not setting notificationsEnabled: true here, or even setting to false,
          // as registration didn't complete. For now, we'll leave it as is,
          // relying on the server not having the token.
        }
      } else {
        console.log('Notification permission denied by browser.');
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          await updateDoc(userDocRef, { notificationsEnabled: false });
        }
        toast('Notification permission denied.', {
          position: "top-right",
          autoClose: 3000,
          theme: "light",
          type: "error"
        });
      }
    } catch (error) {
      console.error('Outer error requesting notification permission:', error);
      toast('Failed to request notification permission.', {
        position: "top-right",
        autoClose: 3000,
        theme: "light",
        type: "error"
      });
    }
  } else {
    console.warn('Notifications not supported by this browser or no service worker.');
    toast('Push notifications are not supported on this browser.', {
      position: "top-right",
      autoClose: 3000,
      theme: "light",
      type: "info"
    });
  }
};
