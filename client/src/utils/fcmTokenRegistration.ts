import { getMessaging, getToken } from "firebase/messaging";
import { auth } from "./firebaseInit";
import { toast } from "react-toastify";

// WebSocket server URL
const WS_SERVER_URL = import.meta.env.VITE_WS_SERVER_URL || 'ws://localhost:8787';
const INSECURE_PRODUCTION = Boolean(import.meta.env.PROD && (!import.meta.env.VITE_WS_SERVER_URL || !import.meta.env.VITE_WS_SERVER_URL.startsWith('wss://')));

// Keep track of the WebSocket connection
let wsConnection: WebSocket | null = null;
let tokenRegistrationInProgress = false;

/**
 * Connect to the WebSocket server
 */
export const connectToWebSocketServer = (): Promise<WebSocket> => {
    if (INSECURE_PRODUCTION) {
        return Promise.reject(new Error('A wss:// VITE_WS_SERVER_URL is required in production.'));
    }
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

    tokenRegistrationInProgress = true; // Set flag early to prevent concurrent calls

    if (!auth.currentUser) {
        throw new Error("User not logged in. Cannot register FCM token.");
    }

    try {
        // Get the current user
        const user = auth.currentUser;
        if (!user) {
            console.error('No authenticated user found');
            tokenRegistrationInProgress = false;
            return false;
        }

        // Ensure the service worker is ready before attempting to get a token
        if (!navigator.serviceWorker.controller) {
            console.log('Service worker not yet controlling the page. Waiting for it to be ready...');
            try {
                // Wait for the service worker to be ready, with a timeout
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Timeout waiting for service worker to be ready.'));
                    }, 10000); // 10-second timeout

                    navigator.serviceWorker.ready.then((registration) => {
                        clearTimeout(timeout);
                        if (registration.active) {
                            console.log('Service worker is active and ready.');
                            resolve(registration);
                        } else {
                            reject(new Error('Service worker registered but not active.'));
                        }
                    }).catch(err => {
                        clearTimeout(timeout);
                        reject(err);
                    });
                });
            } catch (swError) {
                console.error('Error waiting for service worker:', swError);
                toast.error('Service worker issue. Could not initialize notifications. Please refresh or try again.', {
                    position: "top-right",
                    autoClose: 4000,
                    theme: "light"
                });
                tokenRegistrationInProgress = false;
                return false;
            }
        } else {
            console.log('Service worker is already controlling the page.');
        }

        // Get the FCM token
        console.log('Attempting to get FCM token...');
        const messaging = getMessaging();
        const swRegistration = await navigator.serviceWorker.ready;
        const fcmToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: swRegistration
        });

        if (fcmToken) {
            console.log('FCM token obtained (suffix):', fcmToken.slice(-6));
            // After obtaining the token, connect to WebSocket and send it
            const socket = await connectToWebSocketServer();
            const idToken = await user.getIdToken();
            // The server verifies the ID token and derives the UID itself.
            const message = {
                type: 'register_token',
                idToken,
                fcmToken
            };
            socket.send(JSON.stringify(message));
            console.log('Sent FCM token registration message');
            tokenRegistrationInProgress = false;
            return true; // Successfully obtained and initiated sending of token
        } else {
            console.warn('No FCM registration token available. User may need to grant permission or token generation failed silently.');
            tokenRegistrationInProgress = false;
            throw new Error('Failed to obtain FCM token. Permission might not be granted or token generation failed.');
        }
    } catch (error) {
        console.error('Error during FCM token acquisition or initial WebSocket send:', error);
        tokenRegistrationInProgress = false;
        let specificMessage = 'Failed to get or send notification token.';

        const errorName = error instanceof Error ? error.name : '';
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorCode = (error as { code?: unknown }).code;

        if (errorName === 'AbortError') {
            specificMessage = 'Subscription failed: No active Service Worker. Please ensure permissions are granted and try again.';
        } else if (typeof errorCode === 'string' && errorCode.includes('messaging/')) {
            specificMessage = `Firebase messaging error: ${errorMessage}`;
        } else if (errorMessage) {
            specificMessage = errorMessage; // Covers WebSocket connection errors that make it here
        }

        const errToThrow = new Error(specificMessage) as Error & { originalError?: unknown };
        errToThrow.originalError = error;
        throw errToThrow;
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