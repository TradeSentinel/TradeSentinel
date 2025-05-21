import WebSocket, { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import { XChangeService } from './xchangeService'; // Import XChangeService
import path from 'path'; // Import path module
import fs from 'fs'; // Import fs module

// Define a more complete type for Alert data from Firestore
interface Alert {
    id: string;
    userId: string;
    currencyPair: string;
    status: 'active' | 'paused' | 'triggered' | 'cancelled';
    alertType: string; // 'Price rises above' or 'Price falls below'
    triggerPrice: string; // Stored as string, will convert to number for comparison
    notificationPreferences: {
        email: boolean;
        push: boolean;
    };
    createdAt: FirebaseFirestore.Timestamp;
    triggeredAt?: FirebaseFirestore.Timestamp;
}

// Store active alerts in memory for price checking
let currentActiveAlerts: Alert[] = [];

// Load environment variables from .env file
dotenv.config();

let firebaseInitialized = false;
// Initialize Firebase Admin SDK
const serviceAccountPathFromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
console.log('Raw FIREBASE_SERVICE_ACCOUNT_KEY_PATH from .env:', serviceAccountPathFromEnv);

if (serviceAccountPathFromEnv) {
    // Construct an absolute path relative to the project root (server directory)
    // __dirname in an ES module context might behave differently or not be available.
    // process.cwd() gives the directory from which Node.js process was launched.
    // If running `npm run dev` from `server/`, process.cwd() should be `server/`.
    const projectRoot = process.cwd(); // Assumes script is run from server/
    const absoluteServiceAccountPath = path.resolve(projectRoot, serviceAccountPathFromEnv);

    console.log('Resolved absolute path for service account key:', absoluteServiceAccountPath);
    console.log('Current working directory (process.cwd()):', projectRoot);
    console.log('Directory of current module (__dirname, if available):', typeof __dirname !== 'undefined' ? __dirname : 'N/A (ESM or not available)');

    try {
        // Check if the file exists at the resolved path
        if (fs.existsSync(absoluteServiceAccountPath)) {
            console.log('Service account key file FOUND at:', absoluteServiceAccountPath);
            const serviceAccount = require(absoluteServiceAccountPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('Firebase Admin SDK initialized successfully.');
            firebaseInitialized = true;
        } else {
            console.error('Service account key file NOT FOUND at resolved path:', absoluteServiceAccountPath);
            console.error('Please ensure FIREBASE_SERVICE_ACCOUNT_KEY_PATH in .env is correct and relative to the server directory if not absolute.');
            // process.exit(1); 
        }
    } catch (error) {
        console.error('Error initializing Firebase Admin SDK:', error);
        // process.exit(1); // Optionally exit if Firebase is critical
    }
} else {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY_PATH is not set in .env file. Firebase Admin SDK could not be initialized.');
    // process.exit(1); // Optionally exit if Firebase is critical
}


const PORT = process.env.PORT || 8080;
const XCHANGE_API_KEY = process.env.XCHANGE_API_KEY;

const wss = new WebSocketServer({ port: Number(PORT) });

wss.on('listening', () => {
    console.log(`Trade Sentinel WebSocket server started on port ${PORT}`);
});

wss.on('connection', (wsClient) => { // Renamed ws to wsClient to avoid conflict with XChangeService's ws
    console.log('Client connected to Trade Sentinel WebSocket server');

    wsClient.on('message', (message) => {
        console.log('Received message from client:', message.toString());
        // Here we will later handle messages from the client, e.g., FCM token registration
    });

    wsClient.on('close', () => {
        console.log('Client disconnected');
    });

    wsClient.on('error', (error) => {
        console.error('Client WebSocket error:', error);
    });

    wsClient.send('Welcome to Trade Sentinel WebSocket Server!');
});

console.log('Trade Sentinel Server starting...');

let xchangeServiceInstance: XChangeService | null = null;

async function manageAlertSubscriptions() {
    if (!firebaseInitialized) {
        console.log('[manageAlertSubscriptions] Firebase not initialized. Skipping subscription management.');
        return;
    }
    if (!xchangeServiceInstance) {
        console.log('[manageAlertSubscriptions] XChangeService not initialized. Skipping subscription management.');
        return;
    }

    console.log('[manageAlertSubscriptions] Fetching active alerts to update subscriptions...');
    try {
        const db = admin.firestore();
        // This is a collection group query. Requires an index.
        const activeAlertsQuery = db.collectionGroup('alerts')
            .where('status', '==', 'active')
            .orderBy('createdAt', 'asc'); // Matches your existing working index

        const pausedAlertsQuery = db.collectionGroup('alerts')
            .where('status', '==', 'paused')
            .orderBy('createdAt', 'asc'); // Matches your existing working index

        const [activeSnapshot, pausedSnapshot] = await Promise.all([
            activeAlertsQuery.get(),
            pausedAlertsQuery.get()
        ]);

        const activePairs = new Set<string>();

        // Update our in-memory store of active alerts (for price checking)
        const newActiveAlerts: Alert[] = [];
        activeSnapshot.forEach(doc => {
            const data = doc.data();
            const alert: Alert = {
                id: doc.id,
                userId: data.userId,
                currencyPair: data.currencyPair,
                status: data.status as 'active',
                alertType: data.alertType,
                triggerPrice: data.triggerPrice,
                notificationPreferences: data.notificationPreferences || { email: false, push: false },
                createdAt: data.createdAt
            };

            if (alert.currencyPair) {
                activePairs.add(alert.currencyPair.replace('/', ''));
                newActiveAlerts.push(alert);
            }
        });

        // Update the global store with the new list of active alerts
        currentActiveAlerts = newActiveAlerts;
        console.log(`[manageAlertSubscriptions] Loaded ${currentActiveAlerts.length} active alerts for price monitoring.`);

        // Continue collecting all currency pairs we need to monitor (including paused alerts)
        pausedSnapshot.forEach(doc => {
            const alert = doc.data() as Alert;
            if (alert.currencyPair) {
                activePairs.add(alert.currencyPair.replace('/', ''));
            }
        });

        const pairsToSubscribe = Array.from(activePairs);
        const currentlySubscribed = xchangeServiceInstance.getSubscribedPairs(); // Assuming this method exists

        // Determine pairs to add and remove
        const pairsToAdd = pairsToSubscribe.filter(p => !currentlySubscribed.includes(p));
        const pairsToRemove = currentlySubscribed.filter(p => !pairsToSubscribe.includes(p));

        if (pairsToAdd.length > 0) {
            console.log('[manageAlertSubscriptions] Subscribing to new pairs:', pairsToAdd);
            xchangeServiceInstance.subscribe(pairsToAdd);
        }
        if (pairsToRemove.length > 0) {
            console.log('[manageAlertSubscriptions] Unsubscribing from pairs:', pairsToRemove);
            xchangeServiceInstance.unsubscribe(pairsToRemove);
        }
        if (pairsToAdd.length === 0 && pairsToRemove.length === 0) {
            console.log('[manageAlertSubscriptions] No changes to pair subscriptions needed.');
        }
        if (pairsToSubscribe.length > 0 && (pairsToAdd.length > 0 || pairsToRemove.length > 0)) {
            console.log('[manageAlertSubscriptions] Current active subscriptions:', xchangeServiceInstance.getSubscribedPairs());
        } else if (pairsToSubscribe.length === 0) {
            console.log('[manageAlertSubscriptions] No active alerts found for pair subscriptions.');
            // If all pairs are to be removed, XChangeService's unsubscribe will handle sending empty `pairs` list.
            if (currentlySubscribed.length > 0) xchangeServiceInstance.unsubscribe(currentlySubscribed);
        }


    } catch (error) {
        console.error('[manageAlertSubscriptions] Error fetching alerts or updating subscriptions:', error);
    }
}

/**
 * Check if an alert has been triggered by a price update
 */
function isAlertTriggered(alert: Alert, priceUpdate: { ask: string, bid: string }): boolean {
    // Parse the trigger price from the alert
    const triggerPrice = parseFloat(alert.triggerPrice);
    if (isNaN(triggerPrice)) {
        console.error(`[isAlertTriggered] Invalid trigger price for alert ${alert.id}: ${alert.triggerPrice}`);
        return false;
    }

    // For simplicity in this implementation:
    // - "Price rises above" alerts check against the 'bid' price (what buyers are willing to pay)
    // - "Price falls below" alerts check against the 'ask' price (what sellers are asking)
    // This can be refined based on specific trading logic requirements

    const currentAsk = parseFloat(priceUpdate.ask);
    const currentBid = parseFloat(priceUpdate.bid);

    if (isNaN(currentAsk) || isNaN(currentBid)) {
        console.error(`[isAlertTriggered] Invalid price update values: ask=${priceUpdate.ask}, bid=${priceUpdate.bid}`);
        return false;
    }

    if (alert.alertType === 'Price rises above' && currentBid > triggerPrice) {
        return true;
    } else if (alert.alertType === 'Price falls below' && currentAsk < triggerPrice) {
        return true;
    }

    return false;
}

/**
 * Handle an alert that has been triggered
 */
async function handleTriggeredAlert(alert: Alert, priceUpdate: { ask: string, bid: string, timestamp: number }) {
    console.log(`[handleTriggeredAlert] Alert ${alert.id} for ${alert.currencyPair} has been triggered!`);
    console.log(`[handleTriggeredAlert] Condition: ${alert.alertType} ${alert.triggerPrice}`);
    console.log(`[handleTriggeredAlert] Current prices: Ask=${priceUpdate.ask}, Bid=${priceUpdate.bid}`);

    try {
        if (!firebaseInitialized) {
            console.error('[handleTriggeredAlert] Firebase not initialized. Cannot update alert status.');
            return;
        }

        const db = admin.firestore();
        const alertDocRef = db.doc(`users/${alert.userId}/alerts/${alert.id}`);

        // Update the alert in Firestore
        await alertDocRef.update({
            status: 'triggered',
            triggeredAt: admin.firestore.FieldValue.serverTimestamp(),
            triggeredPrice: alert.alertType === 'Price rises above' ? priceUpdate.bid : priceUpdate.ask
        });

        console.log(`[handleTriggeredAlert] Alert ${alert.id} updated to 'triggered' status in Firestore.`);

        // Remove this alert from our in-memory store to prevent re-triggering
        currentActiveAlerts = currentActiveAlerts.filter(a => a.id !== alert.id);

        // Handle notifications based on user preferences
        if (alert.notificationPreferences.push) {
            // TODO: Send FCM push notification
            console.log(`[handleTriggeredAlert] Would send FCM push notification to user ${alert.userId}`);
            // Need to implement: sendFcmNotification(alert, priceUpdate);
        }

        if (alert.notificationPreferences.email) {
            // TODO: Send email notification 
            console.log(`[handleTriggeredAlert] Would send email notification to user ${alert.userId}`);
            // Need to implement: sendEmailNotification(alert, priceUpdate);
        }

    } catch (error) {
        console.error(`[handleTriggeredAlert] Error handling triggered alert ${alert.id}:`, error);
    }
}

if (XCHANGE_API_KEY) {
    xchangeServiceInstance = new XChangeService(XCHANGE_API_KEY);
    xchangeServiceInstance.connect();

    xchangeServiceInstance.on('connected', () => {
        console.log('[MainApp] XChangeService connected.');
        // Manage subscriptions once connected
        manageAlertSubscriptions();
        // Periodically refresh subscriptions every 5 minutes
        setInterval(manageAlertSubscriptions, 5 * 60 * 1000);
        console.log('[MainApp] XChangeService connected. Subscription management initiated and will refresh periodically.');
    });

    xchangeServiceInstance.on('priceUpdate', (priceUpdate) => {
        // Check if this price update matches any of our active alerts
        if (currentActiveAlerts.length === 0) {
            return; // No active alerts to check
        }

        // Get the formatted pair name from the priceUpdate
        const formattedPairName = priceUpdate.pair; // e.g., 'EURUSD'

        // Find all alerts for this currency pair and check if they're triggered
        const alertsForPair = currentActiveAlerts.filter(alert => {
            const alertFormattedPair = alert.currencyPair.replace('/', '');
            return alertFormattedPair === formattedPairName;
        });

        if (alertsForPair.length === 0) {
            return; // No alerts for this currency pair
        }

        // Log price updates occasionally (not every tick to avoid console spam)
        const shouldLog = Math.random() < 0.01; // Log roughly 1% of updates
        if (shouldLog) {
            console.log(`[priceUpdate] ${formattedPairName} - Ask: ${priceUpdate.ask}, Bid: ${priceUpdate.bid}`);
        }

        // Check each alert to see if it's triggered
        for (const alert of alertsForPair) {
            if (isAlertTriggered(alert, priceUpdate)) {
                // Handle this triggered alert and remove from in-memory store
                handleTriggeredAlert(alert, priceUpdate);
            }
        }
    });

    xchangeServiceInstance.on('apiError', (error) => {
        console.error('[MainApp] XChangeService API Error:', error);
    });

    xchangeServiceInstance.on('disconnected', (data) => {
        console.log('[MainApp] XChangeService disconnected.', data?.reason);
        // Consider clearing the interval if you want to stop refreshes when disconnected
        // Or let it continue, and manageAlertSubscriptions will just log if not connected.
    });

    xchangeServiceInstance.on('error', (error) => {
        console.error('[MainApp] XChangeService Error:', error.message);
    });

} else {
    console.error("XCHANGE_API_KEY not found in .env. XChangeService will not start.");
}

// TODO:
// 1. Store FCM tokens from clients (within wss.on('connection') block)
// 2. Dynamic subscription updates (initial fetch done, need listener or periodic refresh)
// 3. Check price updates against alerts & Trigger FCM notifications
// 4. Monitor price alerts from Firestore (requires Firebase to be initialized)
// 5. Trigger FCM notifications (requires Firebase & price data from XChangeService) 