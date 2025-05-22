import { toast } from "react-toastify";
import { registerFcmToken } from "./fcmTokenRegistration";
import { auth, db } from "./firebaseInit";
import { doc, updateDoc } from "firebase/firestore";

export const requestNotificationPermission = async () => {
  if ('Notification' in window && navigator.serviceWorker) {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');

        // Register the FCM token with the server
        try {
          await registerFcmToken();

          // Update user preferences in Firestore
          const user = auth.currentUser;
          if (user) {
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, {
              notificationsEnabled: true
            });
          }

          toast('Notification permission granted', {
            position: "top-right",
            autoClose: 2000,
            theme: "light",
            type: "success"
          });
        } catch (error) {
          console.error('Error registering for notifications:', error);
          toast('Notification permission granted, but registration failed. Please try again.', {
            position: "top-right",
            autoClose: 3000,
            theme: "light",
            type: "warning"
          });
        }
      } else {
        console.log('Notification permission denied.');

        // Update user preferences in Firestore
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          await updateDoc(userDocRef, {
            notificationsEnabled: false
          });
        }

        toast('Notification permission denied.', {
          position: "top-right",
          autoClose: 2000,
          theme: "light",
          type: "error"
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission', error);
    }
  }
};
