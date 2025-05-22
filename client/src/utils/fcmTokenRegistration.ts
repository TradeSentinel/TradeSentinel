import { getMessaging, getToken } from "firebase/messaging";
import { auth } from "./firebaseInit";
import { toast } from "react-toastify";

// WebSocket server URL
const WS_SERVER_URL = import.meta.env.VITE_WS_SERVER_URL || 'ws://localhost:8080';

// Keep track of the WebSocket connection
let wsConnection: WebSocket | null = null;
let tokenRegistrationInProgress = false;

/**
 * Connect to the WebSocket server
 */
export const connectToWebSocketServer = (): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
            return resolve(wsConnection);
        }

        // Close any existing connection
        if (wsConnection) {
            wsConnection.close();
        }

        console.log('Connecting to WebSocket server:', WS_SERVER_URL);
        wsConnection = new WebSocket(WS_SERVER_URL);

        wsConnection.onopen = () => {
            console.log('Connected to WebSocket server');
            resolve(wsConnection as WebSocket);
        };

        wsConnection.onerror = (error) => {
            console.error('WebSocket connection error:', error);
            reject(error);
        };

        wsConnection.onclose = () => {
            console.log('WebSocket connection closed');
            wsConnection = null;
        };

        wsConnection.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('Received WebSocket message:', message);

                // Handle different message types
                switch (message.type) {
                    case 'token_registration_response':
                        if (message.success) {
                            console.log('FCM token registration successful');
                            tokenRegistrationInProgress = false;
                        } else {
                            console.error('FCM token registration failed');
                            tokenRegistrationInProgress = false;
                        }
                        break;

                    case 'error':
                        console.error('WebSocket error message:', message.message);
                        break;

                    case 'connection_established':
                        console.log('WebSocket server status:', message.status);
                        break;

                    default:
                        console.log('Unhandled WebSocket message type:', message.type);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
    });
};

/**
 * Register FCM token with the server
 */
export const registerFcmToken = async (): Promise<boolean> => {
    if (tokenRegistrationInProgress) {
        console.log('FCM token registration already in progress');
        return false;
    }

    try {
        // Get the current user
        const user = auth.currentUser;
        if (!user) {
            console.error('No authenticated user found');
            return false;
        }

        // Get the FCM token
        const messaging = getMessaging();
        const fcmToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        });

        if (!fcmToken) {
            console.error('No FCM token available');
            return false;
        }

        console.log('FCM token obtained:', fcmToken);

        // Connect to the WebSocket server
        tokenRegistrationInProgress = true;
        const ws = await connectToWebSocketServer();

        // Send the token to the server
        const message = {
            type: 'register_token',
            userId: user.uid,
            token: fcmToken
        };

        ws.send(JSON.stringify(message));
        console.log('Sent FCM token registration message');

        // Success will be determined by the WebSocket response handled in onmessage
        return true;
    } catch (error) {
        console.error('Error registering FCM token:', error);
        toast.error('Failed to register for notifications. Please try again later.', {
            position: "top-right",
            autoClose: 3000,
            theme: "light"
        });
        tokenRegistrationInProgress = false;
        return false;
    }
};

/**
 * Initialize FCM and register token
 * Call this function when the user logs in or the app initializes
 */
export const initializeFcmAndRegisterToken = async (): Promise<void> => {
    try {
        // Check if notifications are supported
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return;
        }

        // Check notification permission and register token if granted
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Notification permission granted, registering FCM token');
            await registerFcmToken();
        } else {
            console.log('Notification permission not granted:', permission);
        }
    } catch (error) {
        console.error('Error initializing FCM:', error);
    }
}; 