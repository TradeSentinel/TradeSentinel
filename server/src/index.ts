import WebSocket, { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import nodemailer from 'nodemailer'; // Added nodemailer import
import http from 'http';
import { PriceEngine } from './prices/engine';
import { displayPair, isSupportedPair, normalizePair } from './prices/pairs';
import { PriceEngineStatus, Quote, readPositiveInt } from './prices/types';
import path from 'path'; // Import path module
import fs from 'fs'; // Import fs module

// Message types for WebSocket client-server communication
interface TokenRegistrationMessage {
    type: 'register_token';
    idToken: string;
    fcmToken: string;
}

interface WebSocketMessage {
    type: string;
    [key: string]: any;
}

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
let processingAlertIds = new Set<string>(); // Keeps track of alerts currently being processed

const MAX_FCM_TOKENS_PER_USER = 10;

function isValidFcmToken(token: string): boolean {
    return typeof token === 'string'
        && token.length >= 20
        && token.length <= 4096
        && /^[A-Za-z0-9_\-:.]+$/.test(token);
}

// Short TTL guard against a slow Firestore refresh re-adding an alert that
// was just triggered, which would produce duplicate notifications.
const recentlyTriggeredAlerts = new Map<string, number>();
const RECENT_TRIGGER_TTL_MS = 30_000;

function wasRecentlyTriggered(alertId: string): boolean {
    const triggeredAt = recentlyTriggeredAlerts.get(alertId);
    if (!triggeredAt) return false;
    if (Date.now() - triggeredAt <= RECENT_TRIGGER_TTL_MS) return true;
    recentlyTriggeredAlerts.delete(alertId);
    return false;
}

setInterval(() => {
    const cutoff = Date.now() - RECENT_TRIGGER_TTL_MS;
    for (const [alertId, triggeredAt] of recentlyTriggeredAlerts) {
        if (triggeredAt < cutoff) recentlyTriggeredAlerts.delete(alertId);
    }
}, 60_000).unref();

// Load environment variables from .env file
dotenv.config();

let firebaseInitialized = false;
// Initialize Firebase Admin SDK
const serviceAccountPathFromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;

if (serviceAccountPathFromEnv) {
    // Resolve relative to the server directory (process.cwd() when run from server/).
    const absoluteServiceAccountPath = path.resolve(process.cwd(), serviceAccountPathFromEnv);

    try {
        // Check if the file exists at the resolved path
        if (fs.existsSync(absoluteServiceAccountPath)) {
            console.log('Service account key file found. Initializing Firebase Admin.');
            const serviceAccount = require(absoluteServiceAccountPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('Firebase Admin SDK initialized successfully.');
            firebaseInitialized = true;

            // Initialize real-time listeners for Firestore
            setupFirestoreListeners();
        } else {
            console.error('Service account key file not found at the configured FIREBASE_SERVICE_ACCOUNT_KEY_PATH.');
        }
    } catch (error) {
        console.error('Error initializing Firebase Admin SDK:', error);
    }
} else {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY_PATH is not set. Firebase Admin SDK could not be initialized.');
}


const PORT = process.env.PORT || 8080;

// Nodemailer Transporter Setup
const mailTransporter = nodemailer.createTransport({
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
    } else {
        console.log('[Nodemailer] SMTP Connection verified. Server is ready to take messages.');
    }
});

const priceEngine = new PriceEngine();
const priceSubscriptions = new Map<WebSocket, Set<string>>();

function sendJson(ws: WebSocket, payload: unknown): void {
    if (ws.readyState !== WebSocket.OPEN) return;
    if (ws.bufferedAmount > 1_000_000) {
        ws.terminate();
        return;
    }
    ws.send(JSON.stringify(payload));
}

function snapshotPayload(quote: Quote) {
    return {
        ...quote,
        displayPair: displayPair(quote.pair),
        stale: priceEngine.isStale(quote)
    };
}

function publicStatus(status: PriceEngineStatus) {
    return {
        now: status.now,
        providers: status.providers.map(provider => ({ id: provider.id, state: provider.state })),
        pairs: status.pairs.map(pair => ({
            pair: pair.pair,
            displayPair: pair.displayPair,
            missing: Boolean(pair.missing),
            stale: Boolean(pair.stale),
            delayed: Boolean(pair.delayed),
            marketOpen: Boolean(pair.marketOpen),
            alertEligible: Boolean(pair.alertEligible)
        }))
    };
}

function broadcastPriceStatus(status: PriceEngineStatus): void {
    const payload = publicStatus(status);
    for (const ws of priceSubscriptions.keys()) {
        sendJson(ws, { type: 'price_status', status: payload });
    }
}

function broadcastPrice(quote: Quote): void {
    const payload = {
        type: 'price',
        pair: quote.pair,
        displayPair: displayPair(quote.pair),
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

function priceHealthPayload() {
    const status = priceEngine.getStatus();
    const connectedProviders = status.providers.filter(provider => provider.state === 'connected').length;
    const freshPairs = status.pairs.filter(pair => pair.alertEligible).length;

    return {
        ok: connectedProviders > 0 && freshPairs > 0,
        connectedProviders,
        freshPairs,
        firebase: firebaseInitialized,
        providers: status.providers.map(provider => ({ id: provider.id, state: provider.state })),
        pairs: status.pairs.map(pair => ({
            pair: pair.pair,
            displayPair: pair.displayPair,
            missing: Boolean(pair.missing),
            stale: Boolean(pair.stale),
            delayed: Boolean(pair.delayed),
            marketOpen: Boolean(pair.marketOpen),
            alertEligible: Boolean(pair.alertEligible)
        }))
    };
}

const httpServer = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/ready') {
        const payload = priceHealthPayload();
        const strict = req.url === '/ready';
        res.writeHead(!strict || payload.ok ? 200 : 503, {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
        });
        res.end(JSON.stringify(payload));
        return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
});

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    console.error('[security] ALLOWED_ORIGINS must be set in production. Refusing to start.');
    process.exit(1);
}

const wss = new WebSocketServer({
    server: httpServer,
    maxPayload: 64 * 1024,
    verifyClient: ({ origin }, done) => {
        if (allowedOrigins.length === 0 || (origin && allowedOrigins.includes(origin))) {
            done(true);
            return;
        }
        done(false, 403, 'Forbidden');
    }
});

wss.on('error', (error) => {
    console.error('[WebSocketServer] error:', error.message);
});
const aliveClients = new WeakSet<WebSocket>();

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

const connectionsByIp = new Map<string, number>();
const trustProxy = process.env.TRUST_PROXY === 'true';
const maxTotalConnections = readPositiveInt(process.env.MAX_WS_CONNECTIONS, 500, 'MAX_WS_CONNECTIONS');
const maxConnectionsPerIp = readPositiveInt(process.env.MAX_WS_CONNECTIONS_PER_IP, 20, 'MAX_WS_CONNECTIONS_PER_IP');

function clientIp(req: http.IncomingMessage): string | null {
    // Only trust X-Forwarded-For when a trusted proxy is in front of the app.
    if (!trustProxy) return null;

    const forwarded = req.headers['x-forwarded-for'];
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    if (first) {
        const candidate = first.split(',')[0].trim();
        if (candidate) return candidate;
    }
    return req.socket.remoteAddress || null;
}

wss.on('connection', (wsClient, req) => {
    // Register error and close handling before any early return. A rejected
    // socket can still emit an error (for example an oversized frame), and an
    // unhandled 'error' event would take down the whole process.
    wsClient.on('error', (error) => {
        console.error('Client WebSocket error:', error.message);
    });

    const ip = clientIp(req);
    let countedIp = false;

    wsClient.on('close', () => {
        priceSubscriptions.delete(wsClient);
        if (countedIp && ip) {
            const remaining = (connectionsByIp.get(ip) || 1) - 1;
            if (remaining <= 0) {
                connectionsByIp.delete(ip);
            } else {
                connectionsByIp.set(ip, remaining);
            }
        }
        console.log('Client disconnected');
    });

    if (wss.clients.size > maxTotalConnections) {
        wsClient.terminate();
        return;
    }

    if (ip) {
        const nextCount = (connectionsByIp.get(ip) || 0) + 1;
        if (nextCount > maxConnectionsPerIp) {
            wsClient.terminate();
            return;
        }
        connectionsByIp.set(ip, nextCount);
        countedIp = true;
    }

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
            const parsedMessage: WebSocketMessage = JSON.parse(messageStr);

            // Handle different message types
            switch (parsedMessage.type) {
                case 'register_token': {
                    const tokenMessage = parsedMessage as TokenRegistrationMessage;
                    if (!tokenMessage.idToken || !tokenMessage.fcmToken) {
                        sendJson(wsClient, {
                            type: 'error',
                            message: 'Invalid token registration message. Missing idToken or fcmToken.',
                            timestamp: Date.now()
                        });
                        break;
                    }
                    if (!isValidFcmToken(tokenMessage.fcmToken)) {
                        sendJson(wsClient, {
                            type: 'error',
                            message: 'Invalid FCM token format.',
                            timestamp: Date.now()
                        });
                        break;
                    }
                    if (!firebaseInitialized) {
                        sendJson(wsClient, {
                            type: 'error',
                            message: 'Authentication is not available on this server.',
                            timestamp: Date.now()
                        });
                        break;
                    }
                    try {
                        // The UID comes from the verified token, never from the client.
                        const decoded = await admin.auth().verifyIdToken(tokenMessage.idToken);
                        const success = await storeFcmToken(decoded.uid, tokenMessage.fcmToken);
                        sendJson(wsClient, {
                            type: 'token_registration_response',
                            success,
                            timestamp: Date.now()
                        });
                    } catch (error) {
                        console.error('[register_token] Invalid Firebase ID token');
                        sendJson(wsClient, {
                            type: 'error',
                            message: 'Invalid authentication token.',
                            timestamp: Date.now()
                        });
                    }
                    break;
                }

                case 'subscribe_prices': {
                    let subscriptions = priceSubscriptions.get(wsClient);
                    if (!subscriptions) {
                        subscriptions = new Set<string>();
                        priceSubscriptions.set(wsClient, subscriptions);
                    }

                    const requestedPairs = Array.isArray(parsedMessage.pairs)
                        ? parsedMessage.pairs
                            .slice(0, 50)
                            .map((pair: unknown) => normalizePair(String(pair)))
                            .filter(isSupportedPair)
                        : [];

                    for (const pair of requestedPairs) {
                        subscriptions.add(pair);
                    }

                    sendJson(wsClient, {
                        type: 'subscribed_prices',
                        pairs: Array.from(subscriptions),
                        status: publicStatus(priceEngine.getStatus())
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
                        ? parsedMessage.pairs
                            .slice(0, 50)
                            .map((pair: unknown) => normalizePair(String(pair)))
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
                    console.log(`[WebSocket] Received unsupported message type: ${JSON.stringify(parsedMessage.type)}`);
                    sendJson(wsClient, {
                        type: 'error',
                        message: `Unsupported message type: ${JSON.stringify(parsedMessage.type)}`,
                        timestamp: Date.now()
                    });
            }
        } catch (error) {
            console.error('Error processing client message:', error);
            sendJson(wsClient, {
                type: 'error',
                message: 'Failed to process message',
                timestamp: Date.now()
            });
        }
    });

    // Send welcome message with server status
    sendJson(wsClient, {
        type: 'connection_established',
        message: 'Welcome to Trade Sentinel WebSocket Server!',
        status: {
            firebase: firebaseInitialized,
            prices: publicStatus(priceEngine.getStatus()).providers
        },
        timestamp: Date.now()
    });
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
        const newActiveAlerts: Alert[] = [];

        activeSnapshot.forEach(doc => {
            const data = doc.data();
            if (!data.currencyPair) return;

            newActiveAlerts.push({
                id: doc.id,
                userId: data.userId,
                currencyPair: data.currencyPair,
                status: data.status as 'active',
                alertType: data.alertType,
                triggerPrice: data.triggerPrice,
                notificationPreferences: data.notificationPreferences || { email: false, push: false },
                createdAt: data.createdAt
            });
        });

        currentActiveAlerts = newActiveAlerts;
        console.log(`[alerts] Loaded ${newActiveAlerts.length} active alert(s)`);
    } catch (error) {
        console.error('[alerts] Error loading active alerts:', error);
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
async function handleTriggeredAlert(alert: Alert, priceUpdate: { ask: string, bid: string, timestamp: number }): Promise<boolean> {
    console.log(`[handleTriggeredAlert] Alert ${alert.id} for ${alert.currencyPair} triggered: ${alert.alertType} ${alert.triggerPrice} (ask=${priceUpdate.ask}, bid=${priceUpdate.bid})`);

    const db = admin.firestore();
    const alertRef = db.collection(`users/${alert.userId}/alerts`).doc(alert.id);

    try {
        await alertRef.update({
            status: 'triggered',
            triggeredAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`[handleTriggeredAlert] Alert ${alert.id} updated to 'triggered' in Firestore.`);
    } catch (error) {
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
            } else {
                console.error(`[handleTriggeredAlert] No email for user ${alert.userId}`);
            }
        }
    } catch (error) {
        // The alert is already marked triggered, so a notification failure
        // must not re-arm it and cause duplicate pushes on the next tick.
        console.error(`[handleTriggeredAlert] Notification error for alert ${alert.id}:`, error);
    }

    return true;
}

/**
 * Store or update a user's FCM token in Firestore
 */
async function storeFcmToken(userId: string, token: string): Promise<boolean> {
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
            console.log(`[storeFcmToken] FCM token updated for user ${userId}. Token suffix: ${tokenDocRef.id.slice(-6)}`);
        } else {
            // If it doesn't exist, set it with createdAt and lastUsed
            await tokenDocRef.set({
                // token: token, // Field is redundant if ID is the token, but can keep for explicit queries if desired.
                createdAt: timestamp,
                lastUsed: timestamp,
                platform: 'web'
            });
            console.log(`[storeFcmToken] New FCM token stored for user ${userId}. Token suffix: ${tokenDocRef.id.slice(-6)}`);
        }

        // Cap tokens per user so one account cannot grow the collection without bound.
        const tokenSnapshot = await userRef.collection('fcmTokens').get();
        const sortedTokens = tokenSnapshot.docs.sort((a, b) => {
            const aTime = a.get('lastUsed')?.toMillis?.() ?? 0;
            const bTime = b.get('lastUsed')?.toMillis?.() ?? 0;
            return bTime - aTime;
        });
        const staleTokens = sortedTokens.slice(MAX_FCM_TOKENS_PER_USER);
        if (staleTokens.length > 0) {
            await Promise.all(staleTokens.map(doc => doc.ref.delete()));
        }

        return true;
    } catch (error) {
        console.error(`[storeFcmToken] Error storing FCM token for user ${userId}:`, error instanceof Error ? error.message : error);
        return false;
    }
}

/**
 * Send FCM notification for a triggered alert
 */
async function sendFcmNotification(alert: Alert, priceUpdate: { ask: string, bid: string, timestamp: number }): Promise<boolean> {
    console.log(`[sendFcmNotification DEBUG] ENTER for Alert ID: ${alert.id}, User: ${alert.userId}, Timestamp: ${new Date().toISOString()}`);

    if (!firebaseInitialized) {
        console.error("[sendFcmNotification] Firebase not initialized. Cannot send notification.");
        return false;
    }

    const db = admin.firestore();
    const userTokensRef = db.collection(`users/${alert.userId}/fcmTokens`);
    let tokens: string[] = [];

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
            } else {
                // Fallback or for older data structure: if doc.id is an auto-id, try getting from field
                const tokenData = doc.data();
                if (tokenData && tokenData.token) {
                    tokens.push(tokenData.token);
                    console.warn(`[sendFcmNotification] Using token from field for doc suffix ${doc.id.slice(-6)} for user ${alert.userId}. Consider migrating to token-as-id.`)
                } else {
                    console.warn(`[sendFcmNotification] Document suffix ${doc.id.slice(-6)} for user ${alert.userId} has no ID or token field.`)
                }
            }
        });
    } catch (error) {
        console.error(`[sendFcmNotification] Error fetching FCM tokens for user ${alert.userId}:`, error instanceof Error ? error.message : error);
        return false;
    }

    if (tokens.length === 0) {
        console.log(`[sendFcmNotification] No FCM tokens available for user ${alert.userId} after fetching.`);
        return false;
    }

    tokens = tokens.slice(0, 500);

    const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?alertId=${alert.id}`;

    // Construct the message for sendEachForMulticast
    const message: admin.messaging.MulticastMessage = {
        tokens: tokens,
        data: { // General data payload, accessible by the client app
            url: link,
            alertId: alert.id,
            // Add any other data your client might need when a notification is received while app is in foreground
        },
        webpush: {
            notification: { // This is what's specifically shown to the user by the browser for Web Push
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

        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                failedTokens.push(tokens[idx]);
                console.error(`[sendFcmNotification] Failed to send to token suffix ${tokens[idx].slice(-6)}:`, resp.error);
            }
        });

        if (failedTokens.length > 0) {
            console.log(`[sendFcmNotification] Failed token suffixes for user ${alert.userId}: ${failedTokens.map(token => token.slice(-6)).join(', ')}`);
            // Consider implementing logic to remove failed tokens from Firestore here
        }

        return response.successCount > 0;
    } catch (error) {
        console.error(`[sendFcmNotification] Error sending FCM notification for alert ${alert.id} to user ${alert.userId}:`, error instanceof Error ? error.message : error);
        return false;
    }
}

/**
 * Send Email notification for a triggered alert
 */
async function sendEmailNotification(alert: Alert, priceUpdate: { ask: string, bid: string, timestamp: number }, userEmail: string): Promise<void> {
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
        console.log(`[sendEmailNotification] Email sent for alert ${alert.id} to user ${alert.userId}. Message ID: ${info.messageId}`);
    } catch (error) {
        console.error(`[sendEmailNotification] Error sending email for alert ${alert.id} to user ${alert.userId}:`, error instanceof Error ? error.message : error);
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
                    if (change.type === 'added') changes.added++;
                    if (change.type === 'modified') changes.modified++;
                    if (change.type === 'removed') changes.removed++;
                    console.log(`[FirestoreListener] Change type: ${change.type}, alert ${change.doc.id}`);
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
    } catch (error) {
        console.error('[FirestoreListener] Failed to set up real-time listener:', error);
        console.log('[FirestoreListener] Setting up fallback periodic refresh (every 30 seconds)');
        setInterval(manageAlertSubscriptions, 30 * 1000);
        return null;
    }
}

const lastProviderStates = new Map<string, string>();

priceEngine.on('status', (status: PriceEngineStatus) => {
    let changed = false;
    for (const provider of status.providers) {
        const previous = lastProviderStates.get(provider.id);
        if (previous === provider.state) continue;
        const suffix = provider.lastError ? ` (${provider.lastError})` : '';
        console.log(`[prices] ${provider.id}: ${provider.state}${suffix}`);
        lastProviderStates.set(provider.id, provider.state);
        changed = true;
    }
    if (changed) {
        broadcastPriceStatus(status);
    }
});

priceEngine.on('quote', (quote: Quote) => {
    broadcastPrice(quote);

    if (!priceEngine.canTriggerAlerts(quote)) {
        return;
    }
    if (currentActiveAlerts.length === 0) {
        return;
    }

    const alertsToPotentiallyTrigger: Alert[] = [];
    const stillActiveAlertsForNextTick: Alert[] = [];

    for (const alert of currentActiveAlerts) {
        if (alert.currencyPair.replace('/', '') !== quote.pair) {
            stillActiveAlertsForNextTick.push(alert);
            continue;
        }

        if (isAlertTriggered(alert, quote)) {
            alertsToPotentiallyTrigger.push(alert);
        } else {
            stillActiveAlertsForNextTick.push(alert);
        }
    }

    if (alertsToPotentiallyTrigger.length === 0) {
        return;
    }

    currentActiveAlerts = stillActiveAlertsForNextTick;

    for (const alert of alertsToPotentiallyTrigger) {
        if (processingAlertIds.has(alert.id) || wasRecentlyTriggered(alert.id)) {
            continue;
        }

        processingAlertIds.add(alert.id);
        recentlyTriggeredAlerts.set(alert.id, Date.now());
        currentActiveAlerts = currentActiveAlerts.filter(candidate => candidate.id !== alert.id);

        handleTriggeredAlert(alert, quote)
            .then(persisted => {
                if (!persisted) {
                    recentlyTriggeredAlerts.delete(alert.id);
                    if (!currentActiveAlerts.some(candidate => candidate.id === alert.id)) {
                        currentActiveAlerts.push(alert);
                    }
                }
            })
            .catch(error => {
                console.error(`[alerts] Error handling triggered alert ${alert.id}:`, error);
                recentlyTriggeredAlerts.delete(alert.id);
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

function shutdown(signal: string): void {
    if (shuttingDown) return;
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