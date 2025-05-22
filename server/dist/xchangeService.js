"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XChangeService = void 0;
const ws_1 = __importDefault(require("ws"));
const events_1 = require("events");
class XChangeService extends events_1.EventEmitter {
    constructor(apiKey) {
        super();
        this.ws = null;
        this.apiUrl = 'wss://api.xchangeapi.com/websocket/live';
        this.isConnected = false;
        this.subscribedPairs = new Set();
        this.sessionParams = null;
        this.reconnectInterval = 5000; // 5 seconds
        this.heartbeatInterval = null;
        this.lastMessageTime = 0;
        this.PING_INTERVAL = 30000; // 30 seconds for sending pings
        this.CONNECTION_TIMEOUT = 45000; // 45 seconds, expect a message (pong or data)
        if (!apiKey) {
            throw new Error('XChange API key is required.');
        }
        this.apiKey = apiKey;
    }
    connect() {
        if (this.ws && (this.ws.readyState === ws_1.default.OPEN || this.ws.readyState === ws_1.default.CONNECTING)) {
            console.log('[XChangeService] Already connected or connecting.');
            return;
        }
        console.log('[XChangeService] Attempting to connect...');
        this.ws = new ws_1.default(`${this.apiUrl}?api-key=${this.apiKey}`);
        this.lastMessageTime = Date.now();
        this.ws.on('open', this.onOpen.bind(this));
        this.ws.on('message', this.onMessage.bind(this));
        this.ws.on('close', this.onClose.bind(this));
        this.ws.on('error', this.onError.bind(this));
        this.setupHeartbeat();
    }
    onOpen() {
        this.isConnected = true;
        this.lastMessageTime = Date.now();
        console.log('[XChangeService] Connected to xchangeapi.com');
        this.emit('connected');
        // If there are pairs pending subscription, subscribe them now
        if (this.subscribedPairs.size > 0) {
            this.sendSubscription();
        }
        this.setupHeartbeat(); // Restart heartbeat on (re)connection
    }
    onMessage(data) {
        this.lastMessageTime = Date.now();
        const message = data.toString();
        // console.log('[XChangeService] Received message:', message);
        const messageCode = message.substring(0, 1);
        const messageBody = message.substring(1);
        try {
            if (messageCode === '0') { // Initial connection parameters
                this.sessionParams = JSON.parse(messageBody);
                console.log('[XChangeService] Session parameters received:', this.sessionParams);
                this.emit('sessionParams', this.sessionParams);
            }
            else if (messageCode === '1') { // Price update
                if (!this.sessionParams) {
                    console.warn('[XChangeService] Price update received before session parameters.');
                    return;
                }
                const parts = messageBody.split('|');
                const update = {};
                this.sessionParams.order.forEach((key, index) => {
                    update[key] = parts[index];
                });
                const pairId = update.name;
                const pairName = this.sessionParams.mapping[pairId];
                if (pairName) {
                    const priceUpdate = {
                        pair: pairName,
                        ask: parseFloat(update.ask),
                        bid: parseFloat(update.bid),
                        timestamp: this.sessionParams.start_time + (parseFloat(update.time) / this.sessionParams.time_mult)
                    };
                    // console.log('[XChangeService] Price update:', priceUpdate);
                    this.emit('priceUpdate', priceUpdate);
                }
            }
            else if (messageCode === '2') { // Pong (heartbeat response)
                // console.log('[XChangeService] Pong received');
            }
            else if (messageCode === '7' || messageCode === '9') { // Error messages
                const errorData = JSON.parse(messageBody);
                console.error('[XChangeService] Error message from API:', errorData);
                this.emit('apiError', errorData);
                // Example: {"error":"Invalid choice(s): EURUS"}
                // We might want to handle specific errors, e.g., unsubscribing invalid pairs.
            }
        }
        catch (error) {
            console.error('[XChangeService] Error processing message:', error);
        }
    }
    onClose(code, reason) {
        this.isConnected = false;
        console.log(`[XChangeService] Disconnected from xchangeapi.com. Code: ${code}, Reason: ${reason.toString()}`);
        this.emit('disconnected', { code, reason: reason.toString() });
        this.clearHeartbeat();
        // Attempt to reconnect
        setTimeout(() => {
            console.log('[XChangeService] Attempting to reconnect...');
            this.connect();
        }, this.reconnectInterval);
    }
    onError(error) {
        console.error('[XChangeService] WebSocket error:', error.message);
        this.emit('error', error);
        // The 'close' event will usually follow an error, triggering reconnection logic.
        // If ws is not null and readyState is not closed, explicitly close to trigger onClose
        if (this.ws && this.ws.readyState !== ws_1.default.CLOSED && this.ws.readyState !== ws_1.default.CLOSING) {
            this.ws.close();
        }
    }
    sendSubscription() {
        if (this.ws && this.ws.readyState === ws_1.default.OPEN && this.subscribedPairs.size > 0) {
            const pairsArray = Array.from(this.subscribedPairs);
            console.log(`[XChangeService] Subscribing to pairs: ${pairsArray.join(', ')}`);
            this.ws.send(JSON.stringify({ "pairs": pairsArray }));
        }
        else {
            console.log('[XChangeService] Cannot send subscription: WebSocket not open or no pairs to subscribe.');
        }
    }
    subscribe(pairs) {
        let updated = false;
        pairs.forEach(pair => {
            const formattedPair = pair.replace('/', '');
            if (!this.subscribedPairs.has(formattedPair)) {
                this.subscribedPairs.add(formattedPair);
                updated = true;
            }
        });
        if (updated && this.isConnected) {
            this.sendSubscription();
        }
        else if (updated && !this.isConnected) {
            console.log('[XChangeService] Pairs added to subscription list. Will subscribe upon connection.');
        }
    }
    unsubscribe(pairs) {
        let updated = false;
        pairs.forEach(pair => {
            const formattedPair = pair.replace('/', '');
            if (this.subscribedPairs.has(formattedPair)) {
                this.subscribedPairs.delete(formattedPair);
                updated = true;
            }
        });
        if (updated && this.isConnected) {
            // xchange.md implies new subscription message overwrites old one.
            // If no pairs left, we might not need to send an empty list,
            // but it's safer to send the current (possibly empty) subscription set.
            this.sendSubscription();
        }
    }
    getSubscribedPairs() {
        return Array.from(this.subscribedPairs);
    }
    setupHeartbeat() {
        this.clearHeartbeat(); // Clear any existing heartbeat
        this.heartbeatInterval = setInterval(() => {
            if (!this.ws || this.ws.readyState !== ws_1.default.OPEN) {
                console.warn('[XChangeService Heartbeat] WebSocket not open. Skipping ping.');
                return;
            }
            if (Date.now() - this.lastMessageTime > this.CONNECTION_TIMEOUT) {
                console.error('[XChangeService Heartbeat] Connection timed out. No message received. Terminating and reconnecting.');
                this.ws.terminate(); // Force close, onClose will handle reconnect
                this.clearHeartbeat();
                return;
            }
            // xchange.md states PING is disabled. If it were enabled:
            // console.log('[XChangeService Heartbeat] Sending ping.');
            // this.ws.ping(); 
        }, this.PING_INTERVAL); // Check connection and potentially ping
    }
    clearHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    disconnect() {
        this.clearHeartbeat();
        if (this.ws) {
            console.log('[XChangeService] Disconnecting...');
            this.ws.removeAllListeners(); // Remove listeners to prevent multiple onClose calls if reconnecting
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.subscribedPairs.clear();
        this.sessionParams = null;
    }
}
exports.XChangeService = XChangeService;
// Example Usage (will be integrated into index.ts later):
/*
if (process.env.XCHANGE_API_KEY) {
    const xchangeService = new XChangeService(process.env.XCHANGE_API_KEY);
    xchangeService.connect();

    xchangeService.on('connected', () => {
        console.log('Successfully connected to XChangeService from example.');
        xchangeService.subscribe(['EURUSD', 'GBPCHF']);
    });

    xchangeService.on('priceUpdate', (priceUpdate: XChangePriceUpdate) => {
        console.log('Example: Price Update:', priceUpdate);
    });

    xchangeService.on('apiError', (error) => {
        console.error('Example: API Error:', error);
    });

    xchangeService.on('disconnected', (data) => {
        console.log('Example: Disconnected from XChangeService.', data);
    });

    xchangeService.on('error', (error) => {
        console.error('Example: XChangeService Error:', error.message);
    });

} else {
    console.error("XCHANGE_API_KEY not found in .env. XChangeService example not started.");
}
*/ 
//# sourceMappingURL=xchangeService.js.map