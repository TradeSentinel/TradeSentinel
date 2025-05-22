"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const dotenv_1 = __importDefault(require("dotenv"));
const admin = __importStar(require("firebase-admin"));
const nodemailer_1 = __importDefault(require("nodemailer")); // Added nodemailer import
const xchangeService_1 = require("./xchangeService"); // Import XChangeService
const path_1 = __importDefault(require("path")); // Import path module
const fs_1 = __importDefault(require("fs")); // Import fs module
// Store active alerts in memory for price checking
let currentActiveAlerts = [];
let processingAlertIds = new Set(); // Keeps track of alerts currently being processed
// Load environment variables from .env file
dotenv_1.default.config();
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
    const absoluteServiceAccountPath = path_1.default.resolve(projectRoot, serviceAccountPathFromEnv);
    console.log('Resolved absolute path for service account key:', absoluteServiceAccountPath);
    console.log('Current working directory (process.cwd()):', projectRoot);
    console.log('Directory of current module (__dirname, if available):', typeof __dirname !== 'undefined' ? __dirname : 'N/A (ESM or not available)');
    try {
        // Check if the file exists at the resolved path
        if (fs_1.default.existsSync(absoluteServiceAccountPath)) {
            console.log('Service account key file FOUND at:', absoluteServiceAccountPath);
            const serviceAccount = require(absoluteServiceAccountPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('Firebase Admin SDK initialized successfully.');
            firebaseInitialized = true;
            // Initialize real-time listeners for Firestore
            setupFirestoreListeners();
        }
        else {
            console.error('Service account key file NOT FOUND at resolved path:', absoluteServiceAccountPath);
            console.error('Please ensure FIREBASE_SERVICE_ACCOUNT_KEY_PATH in .env is correct and relative to the server directory if not absolute.');
            // process.exit(1); 
        }
    }
    catch (error) {
        console.error('Error initializing Firebase Admin SDK:', error);
        // process.exit(1); // Optionally exit if Firebase is critical
    }
}
else {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY_PATH is not set in .env file. Firebase Admin SDK could not be initialized.');
    // process.exit(1); // Optionally exit if Firebase is critical
}
const PORT = process.env.PORT || 8080;
const XCHANGE_API_KEY = process.env.XCHANGE_API_KEY;
// Nodemailer Transporter Setup
const mailTransporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "465", 10),
    secure: parseInt(process.env.SMTP_PORT || "465", 10) === 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
mailTransporter.verify((error, success) => {
    if (error) {
        console.error('[Nodemailer] Error verifying SMTP connection:', error);
    }
    else {
        console.log('[Nodemailer] SMTP Connection verified. Server is ready to take messages.');
    }
});
const wss = new ws_1.WebSocketServer({ port: Number(PORT) });
wss.on('listening', () => {
    console.log(`Trade Sentinel WebSocket server started on port ${PORT}`);
});
wss.on('connection', (wsClient) => {
    console.log('Client connected to Trade Sentinel WebSocket server');
    wsClient.on('message', async (message) => {
        try {
            const messageStr = message.toString();
            console.log('Received message from client:', messageStr);
            // Parse the message
            const parsedMessage = JSON.parse(messageStr);
            // Handle different message types
            switch (parsedMessage.type) {
                case 'register_token':
                    // Handle FCM token registration
                    const tokenMessage = parsedMessage;
                    if (tokenMessage.userId && tokenMessage.fcmToken) {
                        const success = await storeFcmToken(tokenMessage.userId, tokenMessage.fcmToken);
                        // Respond to client
                        wsClient.send(JSON.stringify({
                            type: 'token_registration_response',
                            success,
                            timestamp: Date.now()
                        }));
                    }
                    else {
                        wsClient.send(JSON.stringify({
                            type: 'error',
                            message: 'Invalid token registration message. Missing userId or fcmToken.',
                            timestamp: Date.now()
                        }));
                    }
                    break;
                // Handle other message types as needed
                default:
                    console.log(`[WebSocket] Received unsupported message type: ${parsedMessage.type}`);
                    wsClient.send(JSON.stringify({
                        type: 'error',
                        message: `Unsupported message type: ${parsedMessage.type}`,
                        timestamp: Date.now()
                    }));
            }
        }
        catch (error) {
            console.error('Error processing client message:', error);
            wsClient.send(JSON.stringify({
                type: 'error',
                message: 'Failed to process message',
                timestamp: Date.now()
            }));
        }
    });
    wsClient.on('close', () => {
        console.log('Client disconnected');
    });
    wsClient.on('error', (error) => {
        console.error('Client WebSocket error:', error);
    });
    // Send welcome message with server status
    wsClient.send(JSON.stringify({
        type: 'connection_established',
        message: 'Welcome to Trade Sentinel WebSocket Server!',
        status: {
            firebase: firebaseInitialized,
            xchange: xchangeServiceInstance ? 'connected' : 'disconnected'
        },
        timestamp: Date.now()
    }));
});
console.log('Trade Sentinel Server starting...');
let xchangeServiceInstance = null;
async function manageAlertSubscriptions() {
    console.log(`[manageAlertSubscriptions DEBUG] ENTER. currentActiveAlerts before fetch: ${currentActiveAlerts.map(a => `${a.id} (status: ${a.status})`).join(', ')}`);
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
        const activePairs = new Set();
        // Update our in-memory store of active alerts (for price checking)
        const newActiveAlerts = [];
        activeSnapshot.forEach(doc => {
            const data = doc.data();
            const alert = {
                id: doc.id,
                userId: data.userId,
                currencyPair: data.currencyPair,
                status: data.status,
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
        console.log(`[manageAlertSubscriptions DEBUG] Fetched ${newActiveAlerts.length} alerts from Firestore: ${newActiveAlerts.map(a => `${a.id} (status: ${a.status})`).join(', ')}`);
        console.log(`[manageAlertSubscriptions DEBUG] currentActiveAlerts updated. Count: ${currentActiveAlerts.length}. Pairs: ${currentActiveAlerts.map(a => a.currencyPair).join(', ')}`);
        // Continue collecting all currency pairs we need to monitor (including paused alerts)
        pausedSnapshot.forEach(doc => {
            const alert = doc.data();
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
        }
        else if (pairsToSubscribe.length === 0) {
            console.log('[manageAlertSubscriptions] No active alerts found for pair subscriptions.');
            // If all pairs are to be removed, XChangeService's unsubscribe will handle sending empty `pairs` list.
            if (currentlySubscribed.length > 0)
                xchangeServiceInstance.unsubscribe(currentlySubscribed);
        }
    }
    catch (error) {
        console.error('[manageAlertSubscriptions] Error fetching alerts or updating subscriptions:', error);
    }
}
/**
 * Check if an alert has been triggered by a price update
 */
function isAlertTriggered(alert, priceUpdate) {
    // Parse the trigger price from the alert
    const triggerPrice = parseFloat(alert.triggerPrice);
    if (isNaN(triggerPrice)) {
        console.error(`[isAlertTriggered] Invalid trigger price for alert ${alert.id}: ${alert.triggerPrice}`);
        return false;
    }
    const currentAsk = parseFloat(priceUpdate.ask);
    const currentBid = parseFloat(priceUpdate.bid);
    if (isNaN(currentAsk) || isNaN(currentBid)) {
        console.error(`[isAlertTriggered] Invalid price update values: ask=${priceUpdate.ask}, bid=${priceUpdate.bid}`);
        return false;
    }
    // Updated logic based on user feedback
    if (alert.alertType === 'Price rises above' && currentAsk > triggerPrice) {
        console.log(`[isAlertTriggered] 'Price rises above' TRIGGERED for alert ${alert.id}. Ask (${currentAsk}) > Trigger (${triggerPrice})`);
        return true;
    }
    else if (alert.alertType === 'Price falls below' && currentBid < triggerPrice) {
        console.log(`[isAlertTriggered] 'Price falls below' TRIGGERED for alert ${alert.id}. Bid (${currentBid}) < Trigger (${triggerPrice})`);
        return true;
    }
    else if (alert.alertType === 'Price reaching' && (currentBid >= triggerPrice || currentAsk <= triggerPrice)) {
        // If Bid is already >= trigger, it means buyers are willing to pay at or above your price.
        // If Ask is already <= trigger, it means sellers are willing to sell at or below your price.
        let reason = "";
        if (currentBid >= triggerPrice && currentAsk <= triggerPrice) {
            reason = `Bid (${currentBid}) >= Trigger (${triggerPrice}) AND Ask (${currentAsk}) <= Trigger (${triggerPrice}) (Spread crossed target)`;
        }
        else if (currentBid >= triggerPrice) {
            reason = `Bid (${currentBid}) >= Trigger (${triggerPrice})`;
        }
        else if (currentAsk <= triggerPrice) {
            reason = `Ask (${currentAsk}) <= Trigger (${triggerPrice})`;
        }
        console.log(`[isAlertTriggered] 'Price reaching' TRIGGERED for alert ${alert.id}. Reason: ${reason}`);
        return true;
    }
    return false;
}
/**
 * Handle an alert that has been triggered
 */
async function handleTriggeredAlert(alert, priceUpdate) {
    console.log(`[handleTriggeredAlert DEBUG] ENTER for Alert ID: ${alert.id}, Status: ${alert.status}, Timestamp: ${new Date().toISOString()}`);
    console.log(`[handleTriggeredAlert] Alert ${alert.id} for ${alert.currencyPair} has been triggered!`);
    console.log(`[handleTriggeredAlert] Condition: ${alert.alertType} ${alert.triggerPrice}`);
    console.log(`[handleTriggeredAlert] Current prices: Ask=${priceUpdate.ask}, Bid=${priceUpdate.bid}`);
    const db = admin.firestore();
    const alertRef = db.collection(`users/${alert.userId}/alerts`).doc(alert.id);
    try {
        await alertRef.update({
            status: 'triggered',
            triggeredAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`[handleTriggeredAlert] Alert ${alert.id} updated to 'triggered' status in Firestore.`);
        // Send notifications based on user preferences
        if (alert.notificationPreferences?.push) {
            const fcmSuccess = await sendFcmNotification(alert, priceUpdate);
            if (fcmSuccess) {
                console.log(`[handleTriggeredAlert] FCM notification sent for user ${alert.userId}`);
            }
            else {
                console.log(`[handleTriggeredAlert] FCM notification failed or no tokens for user ${alert.userId}`);
            }
        }
        if (alert.notificationPreferences?.email) {
            // Fetch user's email to send the notification
            const userDoc = await db.collection('users').doc(alert.userId).get();
            if (userDoc.exists && userDoc.data()?.email) {
                const userEmail = userDoc.data()?.email;
                console.log(`[handleTriggeredAlert] Attempting to send email notification to ${userEmail} for user ${alert.userId}`);
                await sendEmailNotification(alert, priceUpdate, userEmail);
            }
            else {
                console.error(`[handleTriggeredAlert] Could not find email for user ${alert.userId} to send email notification.`);
            }
        }
        // No longer needed here, as the main list is updated by manageAlertSubscriptions after Firestore change
        // And priceUpdate handler manages the immediate de-duplication with processingAlertIds
        // currentActiveAlerts = currentActiveAlerts.filter(a => a.id !== alert.id);
    }
    catch (error) {
        console.error(`[handleTriggeredAlert] Error updating alert ${alert.id} or sending notifications:`, error);
    }
}
/**
 * Store or update a user's FCM token in Firestore
 */
async function storeFcmToken(userId, token) {
    if (!firebaseInitialized) {
        console.error('[storeFcmToken] Firebase not initialized. Cannot store FCM token.');
        return false;
    }
    try {
        const db = admin.firestore();
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            console.error(`[storeFcmToken] User ${userId} not found.`);
            return false;
        }
        // Use the FCM token string itself as the document ID.
        const tokenDocRef = userRef.collection('fcmTokens').doc(token);
        // Get current timestamp for both createdAt and lastUsed on new token
        const timestamp = admin.firestore.FieldValue.serverTimestamp();
        // Check if the document (token) already exists to determine if it's an update or new storage
        const tokenDocSnapshot = await tokenDocRef.get();
        const isUpdate = tokenDocSnapshot.exists;
        if (isUpdate) {
            // If it exists, only update lastUsed
            await tokenDocRef.update({
                lastUsed: timestamp
            });
            console.log(`[storeFcmToken] FCM token updated for user ${userId}. Doc ID (token): ${tokenDocRef.id}`);
        }
        else {
            // If it doesn't exist, set it with createdAt and lastUsed
            await tokenDocRef.set({
                // token: token, // Field is redundant if ID is the token, but can keep for explicit queries if desired.
                createdAt: timestamp,
                lastUsed: timestamp,
                platform: 'web'
            });
            console.log(`[storeFcmToken] New FCM token stored for user ${userId}. Doc ID (token): ${tokenDocRef.id}`);
        }
        return true;
    }
    catch (error) {
        console.error(`[storeFcmToken] Error storing FCM token for user ${userId}:`, error);
        return false;
    }
}
/**
 * Send FCM notification for a triggered alert
 */
async function sendFcmNotification(alert, priceUpdate) {
    console.log(`[sendFcmNotification DEBUG] ENTER for Alert ID: ${alert.id}, User: ${alert.userId}, Timestamp: ${new Date().toISOString()}`);
    if (!firebaseInitialized) {
        console.error("[sendFcmNotification] Firebase not initialized. Cannot send notification.");
        return false;
    }
    const db = admin.firestore();
    const userTokensRef = db.collection(`users/${alert.userId}/fcmTokens`);
    let tokens = [];
    try {
        const snapshot = await userTokensRef.get();
        if (snapshot.empty) {
            console.log(`[sendFcmNotification] No FCM tokens found for user ${alert.userId}.`);
            return false;
        }
        // Correctly get the token from the document ID (which is now the token itself)
        snapshot.forEach(doc => {
            // The document ID is the token
            if (doc.id) { // Basic check to ensure doc.id is not empty/undefined
                tokens.push(doc.id);
            }
            else {
                // Fallback or for older data structure: if doc.id is an auto-id, try getting from field
                const tokenData = doc.data();
                if (tokenData && tokenData.token) {
                    tokens.push(tokenData.token);
                    console.warn(`[sendFcmNotification] Using token from field for doc ${doc.id} for user ${alert.userId}. Consider migrating to token-as-id.`);
                }
                else {
                    console.warn(`[sendFcmNotification] Document ${doc.id} for user ${alert.userId} has no ID or token field.`);
                }
            }
        });
    }
    catch (error) {
        console.error(`[sendFcmNotification] Error fetching FCM tokens for user ${alert.userId}:`, error);
        return false;
    }
    if (tokens.length === 0) {
        console.log(`[sendFcmNotification] No FCM tokens available for user ${alert.userId} after fetching.`);
        return false;
    }
    const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?alertId=${alert.id}`;
    // Construct the message for sendEachForMulticast
    const message = {
        tokens: tokens,
        data: {
            url: link,
            alertId: alert.id,
            // Add any other data your client might need when a notification is received while app is in foreground
        },
        webpush: {
            notification: {
                title: `${alert.currencyPair}`,
                body: `${alert.alertType} ${alert.triggerPrice}. Current Ask: ${priceUpdate.ask}, Bid: ${priceUpdate.bid}`,
                icon: '/sentinel_logo.png',
                // 'data' within webpush.notification is specifically for the service worker when it constructs the notification
                // or handles a click on a displayed notification.
                data: {
                    url: link,
                    alertId: alert.id,
                    currencyPair: alert.currencyPair,
                    alertType: alert.alertType,
                    triggerPrice: alert.triggerPrice,
                    // You can add more structured data here if your service worker needs it.
                },
                // tag: `alert-${alert.id}`, // Optional: helps in replacing/collapsing notifications
                // requireInteraction: true, // Optional: keeps notification visible until user interaction
            },
            fcmOptions: {
                link: link // Fallback link if service worker doesn't handle click, or for platforms where service worker click handling is not supported
            }
        },
        // The top-level notification object is removed as webpush.notification is more specific for web tokens.
        // notification: notificationPayload.notification, // REMOVED
    };
    try {
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`[sendFcmNotification] Sent notifications to ${response.successCount} of ${tokens.length} devices for user ${alert.userId}.`);
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                failedTokens.push(tokens[idx]);
                console.error(`[sendFcmNotification] Failed to send to token ${tokens[idx]}:`, resp.error);
            }
        });
        if (failedTokens.length > 0) {
            console.log(`[sendFcmNotification] Failed tokens for user ${alert.userId}: ${failedTokens.join(', ')}`);
            // Consider implementing logic to remove failed tokens from Firestore here
        }
        return response.successCount > 0;
    }
    catch (error) {
        console.error(`[sendFcmNotification] Error sending FCM notification for alert ${alert.id} to user ${alert.userId}:`, error);
        return false;
    }
}
/**
 * Send Email notification for a triggered alert
 */
async function sendEmailNotification(alert, priceUpdate, userEmail) {
    console.log(`[sendEmailNotification DEBUG] ENTER for Alert ID: ${alert.id}, User: ${alert.userId}, Email: ${userEmail}`);
    const subject = `Trade Sentinel Alert: ${alert.currencyPair} Triggered!`;
    const textBody = `
Hello,

Your alert for ${alert.currencyPair} has been triggered.
Condition: ${alert.alertType} ${alert.triggerPrice}
Current Ask Price: ${priceUpdate.ask}
Current Bid Price: ${priceUpdate.bid}
Triggered At: ${new Date(priceUpdate.timestamp * 1000).toUTCString()}

You can view your alerts here: ${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?alertId=${alert.id}

Regards,
The Trade Sentinel Team
    `;
    const htmlBody = `
<p>Hello,</p>
<p>Your alert for <strong>${alert.currencyPair}</strong> has been triggered.</p>
<ul>
    <li><strong>Condition:</strong> ${alert.alertType} ${alert.triggerPrice}</li>
    <li><strong>Current Ask Price:</strong> ${priceUpdate.ask}</li>
    <li><strong>Current Bid Price:</strong> ${priceUpdate.bid}</li>
    <li><strong>Triggered At:</strong> ${new Date(priceUpdate.timestamp * 1000).toUTCString()}</li>
</ul>
<p>You can view your alerts <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?alertId=${alert.id}">here</a>.</p>
<p>Regards,<br/>The Trade Sentinel Team</p>
    `;
    const mailOptions = {
        from: process.env.SMTP_FROM_EMAIL || `"Trade Sentinel Alerts" <alert@tradesentinel.xyz>`,
        to: userEmail,
        subject: subject,
        text: textBody,
        html: htmlBody,
    };
    try {
        const info = await mailTransporter.sendMail(mailOptions);
        console.log(`[sendEmailNotification] Email sent successfully to ${userEmail} for alert ${alert.id}. Message ID: ${info.messageId}`);
    }
    catch (error) {
        console.error(`[sendEmailNotification] Error sending email to ${userEmail} for alert ${alert.id}:`, error);
        // Optionally, you might want to implement a retry mechanism or log this to a more persistent error tracking service
    }
}
/**
 * Setup Firestore real-time listeners for instant alert updates
 */
function setupFirestoreListeners() {
    if (!firebaseInitialized) {
        console.error("[setupFirestoreListeners] Firebase not initialized. Cannot setup listeners.");
        return;
    }
    const db = admin.firestore();
    try {
        // Listen to all alerts collections across all users for real-time updates
        const unsubscribe = db.collectionGroup('alerts')
            .where('status', 'in', ['active', 'paused'])
            .onSnapshot((snapshot) => {
            console.log('[FirestoreListener] Alert collection changed, refreshing subscriptions immediately');
            // Track changes for logging
            const changes = {
                added: 0,
                modified: 0,
                removed: 0
            };
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added')
                    changes.added++;
                if (change.type === 'modified')
                    changes.modified++;
                if (change.type === 'removed')
                    changes.removed++;
                console.log(`[FirestoreListener DEBUG] Change type: ${change.type}, Doc ID: ${change.doc.id}, Data: ${JSON.stringify(change.doc.data())}`);
            });
            console.log(`[FirestoreListener] Changes detected: ${changes.added} added, ${changes.modified} modified, ${changes.removed} removed`);
            // Trigger immediate subscription update
            manageAlertSubscriptions();
        }, (error) => {
            console.error('[FirestoreListener] Error in real-time listener:', error);
            console.log('[FirestoreListener] Falling back to periodic refresh for alert changes');
            // If real-time listener fails, set up a more frequent periodic refresh as fallback
            console.log('[FirestoreListener] Setting up fallback periodic refresh (every 30 seconds)');
            setInterval(manageAlertSubscriptions, 30 * 1000);
            // Important notice about required index
            if (error.message.includes('Error 9:') || error.message.includes('requires an index')) {
                console.log('\n======================= IMPORTANT =======================');
                console.log('A Firestore index is required for real-time alert monitoring.');
                console.log('Please create the index by visiting the URL in the error message above.');
                console.log('After creating the index, restart this server.');
                console.log('======================= IMPORTANT =======================\n');
            }
        });
        console.log('[FirestoreListener] Real-time alert monitoring enabled');
        // Return unsubscribe function (for cleanup if needed)
        return unsubscribe;
    }
    catch (error) {
        console.error('[FirestoreListener] Failed to set up real-time listener:', error);
        console.log('[FirestoreListener] Setting up fallback periodic refresh (every 30 seconds)');
        setInterval(manageAlertSubscriptions, 30 * 1000);
        return null;
    }
}
if (XCHANGE_API_KEY) {
    xchangeServiceInstance = new xchangeService_1.XChangeService(XCHANGE_API_KEY);
    xchangeServiceInstance.connect();
    xchangeServiceInstance.on('connected', () => {
        console.log('[MainApp] XChangeService connected.');
        // Manage subscriptions once connected
        manageAlertSubscriptions();
        // No need for periodic refresh as we're using Firestore real-time listeners
        // that trigger manageAlertSubscriptions whenever an alert changes
        console.log('[MainApp] XChangeService connected. Subscription management initiated.');
    });
    xchangeServiceInstance.on('priceUpdate', (priceUpdate) => {
        if (currentActiveAlerts.length === 0) {
            return;
        }
        const formattedPairName = priceUpdate.pair;
        const alertsToPotentiallyTrigger = [];
        const stillActiveAlertsForNextTick = [];
        console.log(`[priceUpdate DEBUG] Event for pair: ${formattedPairName} at ${new Date().toISOString()}`);
        console.log(`[priceUpdate DEBUG] Alerts for this pair in currentActiveAlerts: ${currentActiveAlerts.filter(a => a.currencyPair.replace('/', '') === formattedPairName).map(a => `${a.id} (status: ${a.status})`).join(', ')}`);
        console.log(`[priceUpdate DEBUG] processingAlertIds before loop: ${Array.from(processingAlertIds).join(', ')}`);
        for (const alert of currentActiveAlerts) {
            const alertFormattedPair = alert.currencyPair.replace('/', '');
            if (alertFormattedPair === formattedPairName) {
                if (isAlertTriggered(alert, priceUpdate)) {
                    alertsToPotentiallyTrigger.push(alert);
                }
                else {
                    stillActiveAlertsForNextTick.push(alert);
                }
            }
            else {
                stillActiveAlertsForNextTick.push(alert);
            }
        }
        // If any alerts were triggered, update currentActiveAlerts to only include those not triggered this tick.
        // This helps prevent the *same* price update event from re-evaluating already processed alerts in this specific tick.
        if (alertsToPotentiallyTrigger.length > 0) {
            currentActiveAlerts = stillActiveAlertsForNextTick;
        }
        if (alertsToPotentiallyTrigger.length === 0) {
            return;
        }
        console.log(`[priceUpdate DEBUG] alertsToPotentiallyTrigger: ${alertsToPotentiallyTrigger.map(a => a.id).join(', ')}`);
        const shouldLog = Math.random() < 0.01;
        if (shouldLog) {
            console.log(`[priceUpdate] ${formattedPairName} - Ask: ${priceUpdate.ask}, Bid: ${priceUpdate.bid}`);
        }
        for (const alert of alertsToPotentiallyTrigger) {
            console.log(`[priceUpdate DEBUG] Checking alert ${alert.id}. Is in processingAlertIds: ${processingAlertIds.has(alert.id)}`);
            if (processingAlertIds.has(alert.id)) {
                console.log(`[priceUpdate] Alert ${alert.id} is already being processed. Skipping.`);
                // Add it back to currentActiveAlerts if it's skipped here, so it can be re-evaluated by the next price tick
                // if it wasn't successfully marked 'triggered' by the first processing attempt.
                // However, this might re-introduce it too soon if the first handleTriggeredAlert is just slow.
                // A better approach might be to rely on manageAlertSubscriptions to repopulate if needed after Firestore is updated.
                // For now, let's keep it simple: if it's processing, it's locked out from this new trigger event.
                // If the processing fails, manageAlertSubscriptions should eventually pick it up again if still 'active'.
                continue;
            }
            processingAlertIds.add(alert.id);
            console.log(`[priceUpdate] Added ${alert.id} to processingAlertIds. Current set:`, Array.from(processingAlertIds));
            // Immediately filter this alert out of the local cache to prevent re-triggering by subsequent rapid price ticks
            // before Firestore listener updates the cache.
            currentActiveAlerts = currentActiveAlerts.filter(a => a.id !== alert.id);
            // Asynchronously handle the triggered alert
            handleTriggeredAlert(alert, priceUpdate)
                .catch(err => {
                console.error(`[priceUpdate] Error in async handleTriggeredAlert for ${alert.id}:`, err);
            })
                .finally(() => {
                processingAlertIds.delete(alert.id);
                console.log(`[priceUpdate] Removed ${alert.id} from processingAlertIds. Current set:`, Array.from(processingAlertIds));
            });
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
}
else {
    console.error("XCHANGE_API_KEY not found in .env. XChangeService will not start.");
}
// TODO:
// 1. ✅ Store FCM tokens from clients (implemented in WebSocket handler)
// 2. ✅ Dynamic subscription updates (implemented with Firestore real-time listeners)
// 3. ✅ Check price updates against alerts & Trigger FCM notifications (implemented)
// 4. ✅ Monitor price alerts from Firestore (implemented with real-time listeners)
// 5. ✅ Trigger FCM notifications (implemented with sendFcmNotification function)
//# sourceMappingURL=index.js.map