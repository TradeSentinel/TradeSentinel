export interface LivePrice {
    ask: string;
    bid: string;
    timestamp: number | null;
}

export interface WsParams {
    mapping: Record<string, string> | null;
    order: string[] | null;
    startTime: number | null;
    timeMult: number | null;
    sessionUID: string | null;
}

export type WsStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'subscribed'; 