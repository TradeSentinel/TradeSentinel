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
const ws_1 = __importStar(require("ws"));
const dotenv_1 = __importDefault(require("dotenv"));
const admin = __importStar(require("firebase-admin"));
const nodemailer_1 = __importDefault(require("nodemailer")); // Added nodemailer import
const http_1 = __importDefault(require("http"));
const engine_1 = require("./prices/engine");
const pairs_1 = require("./prices/pairs");
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
const priceEngine = new engine_1.PriceEngine();
const priceSubscriptions = new Map();
function sendJson(ws, payload) {
    if (ws.readyState !== ws_1.default.OPEN)
        return;
    if (ws.bufferedAmount > 1000000) {
        ws.terminate();
        return;
    }
    ws.send(JSON.stringify(payload));
}
function snapshotPayload(quote) {
    return {
        ...quote,
        displayPair: (0, pairs_1.displayPair)(quote.pair),
        stale: priceEngine.isStale(quote)
    };
}
function broadcastPriceStatus(status) {
    for (const ws of priceSubscriptions.keys()) {
        sendJson(ws, { type: 'price_status', status });
    }
}
function broadcastPrice(quote) {
    const payload = {
        type: 'price',
        pair: quote.pair,
        displayPair: (0, pairs_1.displayPair)(quote.pair),
        bid: quote.bid,
        ask: quote.ask,
        timestamp: quote.timestamp,
        source: quote.source,
        stale: priceEngine.isStale(quote),
        delayed: quote.delayed,
        marketOpen: quote.marketOpen,
        quoteAgeSeconds: quote.quoteAgeSeconds,
        receivedAt: quote.receivedAt
    };
    for (const [ws, pairs] of priceSubscriptions) {
        if (pairs.has(quote.pair)) {
            sendJson(ws, payload);
        }
    }
}
const httpServer = http_1.default.createServer((req, res) => {
    if (req.url === '/health') {
        const status = priceEngine.getStatus();
        const connectedProviders = status.providers.filter(provider => provider.state === 'connected').length;
        const freshPairs = status.pairs.filter(pair => !pair.missing && !pair.stale && !pair.delayed && pair.marketOpen).length;
        const ok = connectedProviders > 0 && freshPairs > 0;
        res.writeHead(ok ? 200 : 503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            ok,
            connectedProviders,
            freshPairs,
            firebase: firebaseInitialized,
            prices: status
        }));
        return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
});
const wss = new ws_1.WebSocketServer({ server: httpServer, maxPayload: 64 * 1024 });
const aliveClients = new WeakSet();
const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
        if (!aliveClients.has(ws)) {
            ws.terminate();
            continue;
        }
        aliveClients.delete(ws);
        ws.ping();
    }
}, 30000);
heartbeat.unref();
wss.on('close', () => clearInterval(heartbeat));
httpServer.listen(Number(PORT), () => {
    console.log(`Trade Sentinel server started on port ${PORT} (WebSocket + /health)`);
});
wss.on('connection', (wsClient) => {
    console.log('Client connected to Trade Sentinel WebSocket server');
    aliveClients.add(wsClient);
    wsClient.on('pong', () => aliveClients.add(wsClient));
    let messageCount = 0;
    let messageWindowStartedAt = Date.now();
    wsClient.on('message', async (message) => {
        if (Date.now() - messageWindowStartedAt > 10000) {
            messageCount = 0;
            messageWindowStartedAt = Date.now();
        }
        messageCount++;
        if (messageCount > 100) {
            wsClient.close(1008, 'Rate limit exceeded');
            return;
        }
        try {
            const messageStr = message.toString();
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
                case 'subscribe_prices': {
                    let subscriptions = priceSubscriptions.get(wsClient);
                    if (!subscriptions) {
                        subscriptions = new Set();
                        priceSubscriptions.set(wsClient, subscriptions);
                    }
                    const requestedPairs = Array.isArray(parsedMessage.pairs)
                        ? parsedMessage.pairs
                            .map((pair) => (0, pairs_1.normalizePair)(String(pair)))
                            .filter(pairs_1.isSupportedPair)
                        : [];
                    for (const pair of requestedPairs) {
                        subscriptions.add(pair);
                    }
                    sendJson(wsClient, {
                        type: 'subscribed_prices',
                        pairs: Array.from(subscriptions),
                        status: priceEngine.getStatus()
                    });
                    const snapshot = priceEngine.getSnapshot(Array.from(subscriptions));
                    if (snapshot.length > 0) {
                        sendJson(wsClient, {
                            type: 'price_snapshot',
                            quotes: snapshot.map(snapshotPayload)
                        });
                    }
                    break;
                }
                case 'unsubscribe_prices': {
                    const subscriptions = priceSubscriptions.get(wsClient);
                    const pairsToRemove = Array.isArray(parsedMessage.pairs)
                        ? parsedMessage.pairs.map((pair) => (0, pairs_1.normalizePair)(String(pair)))
                        : [];
                    if (subscriptions) {
                        for (const pair of pairsToRemove) {
                            subscriptions.delete(pair);
                        }
                    }
                    sendJson(wsClient, {
                        type: 'unsubscribed_prices',
                        pairs: subscriptions ? Array.from(subscriptions) : []
                    });
                    break;
                }
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
        priceSubscriptions.delete(wsClient);
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
            prices: priceEngine.getStatus().providers.map(provider => ({
                id: provider.id,
                state: provider.state
            }))
        },
        timestamp: Date.now()
    }));
});
console.log('Trade Sentinel Server starting...');
async function manageAlertSubscriptions() {
    if (!firebaseInitialized) {
        return;
    }
    try {
        const db = admin.firestore();
        const activeAlertsQuery = db.collectionGroup('alerts')
            .where('status', '==', 'active')
            .orderBy('createdAt', 'asc');
        const activeSnapshot = await activeAlertsQuery.get();
        const newActiveAlerts = [];
        activeSnapshot.forEach(doc => {
            const data = doc.data();
            if (!data.currencyPair)
                return;
            newActiveAlerts.push({
                id: doc.id,
                userId: data.userId,
                currencyPair: data.currencyPair,
                status: data.status,
                alertType: data.alertType,
                triggerPrice: data.triggerPrice,
                notificationPreferences: data.notificationPreferences || { email: false, push: false },
                createdAt: data.createdAt
            });
        });
        currentActiveAlerts = newActiveAlerts;
        console.log(`[alerts] Loaded ${newActiveAlerts.length} active alert(s)`);
    }
    catch (error) {
        console.error('[alerts] Error loading active alerts:', error);
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
    if (alert.alertType === 'Price rising above' && currentAsk > triggerPrice) {
        console.log(`[isAlertTriggered] 'Price rising above' TRIGGERED for alert ${alert.id}. Ask (${currentAsk}) > Trigger (${triggerPrice})`);
        return true;
    }
    if (alert.alertType === 'Price dropping below' && currentBid < triggerPrice) {
        console.log(`[isAlertTriggered] 'Price dropping below' TRIGGERED for alert ${alert.id}. Bid (${currentBid}) < Trigger (${triggerPrice})`);
        return true;
    }
    if (alert.alertType === 'Price reaching') {
        /*
            This is the definitive logic for 'Price reaching', handling three cases:
            1. The trigger price is above the market (higher than the ask).
            2. The trigger price is below the market (lower than the bid).
            3. The trigger price is inside the current bid-ask spread.
        */
        // Case 1: Trigger is above the current market. We only watch for the price to move UP.
        if (triggerPrice > currentAsk) {
            if (currentBid >= triggerPrice) {
                console.log(`[isAlertTriggered] 'Price reaching' TRIGGERED. Reason: Trigger was above market, Bid (${currentBid}) rose to >= Trigger (${triggerPrice})`);
                return true;
            }
        }
        // Case 2: Trigger is below the current market. We only watch for the price to move DOWN.
        else if (triggerPrice < currentBid) {
            if (currentAsk <= triggerPrice) {
                console.log(`[isAlertTriggered] 'Price reaching' TRIGGERED. Reason: Trigger was below market, Ask (${currentAsk}) fell to <= Trigger (${triggerPrice})`);
                return true;
            }
        }
        // Case 3: Trigger is inside the bid-ask spread. Price can hit it from either direction.
        else { // This covers `currentBid <= triggerPrice <= currentAsk`
            if (currentBid >= triggerPrice) {
                console.log(`[isAlertTriggered] 'Price reaching' TRIGGERED. Reason: Trigger was inside spread, Bid (${currentBid}) >= Trigger (${triggerPrice})`);
                return true;
            }
            if (currentAsk <= triggerPrice) {
                console.log(`[isAlertTriggered] 'Price reaching' TRIGGERED. Reason: Trigger was inside spread, Ask (${currentAsk}) <= Trigger (${triggerPrice})`);
                return true;
            }
        }
    }
    return false;
}
/**
 * Handle an alert that has been triggered
 */
async function handleTriggeredAlert(alert, priceUpdate) {
    console.log(`[handleTriggeredAlert] Alert ${alert.id} for ${alert.currencyPair} triggered: ${alert.alertType} ${alert.triggerPrice} (ask=${priceUpdate.ask}, bid=${priceUpdate.bid})`);
    const db = admin.firestore();
    const alertRef = db.collection(`users/${alert.userId}/alerts`).doc(alert.id);
    try {
        await alertRef.update({
            status: 'triggered',
            triggeredAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`[handleTriggeredAlert] Alert ${alert.id} updated to 'triggered' in Firestore.`);
    }
    catch (error) {
        // Returning false lets the quote handler put the alert back in memory
        // so the next tick retries instead of silently dropping the alert.
        console.error(`[handleTriggeredAlert] Failed to persist triggered status for alert ${alert.id}:`, error);
        return false;
    }
    try {
        if (alert.notificationPreferences?.push) {
            const fcmSuccess = await sendFcmNotification(alert, priceUpdate);
            console.log(`[handleTriggeredAlert] FCM ${fcmSuccess ? 'sent' : 'not sent'} for user ${alert.userId}`);
        }
        if (alert.notificationPreferences?.email) {
            const userDoc = await db.collection('users').doc(alert.userId).get();
            const userEmail = userDoc.exists ? userDoc.data()?.email : undefined;
            if (userEmail) {
                await sendEmailNotification(alert, priceUpdate, userEmail);
            }
            else {
                console.error(`[handleTriggeredAlert] No email for user ${alert.userId}`);
            }
        }
    }
    catch (error) {
        // The alert is already marked triggered, so a notification failure
        // must not re-arm it and cause duplicate pushes on the next tick.
        console.error(`[handleTriggeredAlert] Notification error for alert ${alert.id}:`, error);
    }
    return true;
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
const lastProviderStates = new Map();
priceEngine.on('status', (status) => {
    let changed = false;
    for (const provider of status.providers) {
        const previous = lastProviderStates.get(provider.id);
        if (previous === provider.state)
            continue;
        const suffix = provider.lastError ? ` (${provider.lastError})` : '';
        console.log(`[prices] ${provider.id}: ${provider.state}${suffix}`);
        lastProviderStates.set(provider.id, provider.state);
        changed = true;
    }
    if (changed) {
        broadcastPriceStatus(status);
    }
});
priceEngine.on('quote', (quote) => {
    broadcastPrice(quote);
    if (!priceEngine.canTriggerAlerts(quote)) {
        return;
    }
    if (currentActiveAlerts.length === 0) {
        return;
    }
    const alertsToPotentiallyTrigger = [];
    const stillActiveAlertsForNextTick = [];
    for (const alert of currentActiveAlerts) {
        if (alert.currencyPair.replace('/', '') !== quote.pair) {
            stillActiveAlertsForNextTick.push(alert);
            continue;
        }
        if (isAlertTriggered(alert, quote)) {
            alertsToPotentiallyTrigger.push(alert);
        }
        else {
            stillActiveAlertsForNextTick.push(alert);
        }
    }
    if (alertsToPotentiallyTrigger.length === 0) {
        return;
    }
    currentActiveAlerts = stillActiveAlertsForNextTick;
    for (const alert of alertsToPotentiallyTrigger) {
        if (processingAlertIds.has(alert.id)) {
            continue;
        }
        processingAlertIds.add(alert.id);
        currentActiveAlerts = currentActiveAlerts.filter(candidate => candidate.id !== alert.id);
        handleTriggeredAlert(alert, quote)
            .then(persisted => {
            if (!persisted && !currentActiveAlerts.some(candidate => candidate.id === alert.id)) {
                currentActiveAlerts.push(alert);
            }
        })
            .catch(error => {
            console.error(`[alerts] Error handling triggered alert ${alert.id}:`, error);
            if (!currentActiveAlerts.some(candidate => candidate.id === alert.id)) {
                currentActiveAlerts.push(alert);
            }
        })
            .finally(() => {
            processingAlertIds.delete(alert.id);
        });
    }
});
priceEngine.start();
manageAlertSubscriptions().catch(error => {
    console.error('[alerts] Initial active alert load failed:', error);
});
let shuttingDown = false;
function shutdown(signal) {
    if (shuttingDown)
        return;
    shuttingDown = true;
    console.log(`[server] ${signal} received, shutting down`);
    priceEngine.stop();
    for (const client of wss.clients) {
        client.terminate();
    }
    wss.close();
    httpServer.close(() => process.exit(0));
    // Do not let a stuck connection block a deploy.
    setTimeout(() => process.exit(0), 2000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
// TODO:
// 1. ✅ Store FCM tokens from clients (implemented in WebSocket handler)
// 2. ✅ Dynamic subscription updates (implemented with Firestore real-time listeners)
// 3. ✅ Check price updates against alerts & Trigger FCM notifications (implemented)
// 4. ✅ Monitor price alerts from Firestore (implemented with real-time listeners)
// 5. ✅ Trigger FCM notifications (implemented with sendFcmNotification function)
//# sourceMappingURL=index.js.map