export interface LivePrice {
    ask: string;
    bid: string;
    timestamp: number | null;
    stale?: boolean;
    delayed?: boolean;
    source?: string;
}

export type WsStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'subscribed'; 