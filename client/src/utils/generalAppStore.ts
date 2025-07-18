import { User } from "firebase/auth";
import { create } from "zustand";
import { WsParams, WsStatus } from "../types/websocket";

// Define initialTopPairs here to be accessible by the store
// This could also be fetched or configured elsewhere in a larger app
const initialTopPairsList = [
  { name: 'EUR/USD' },
  { name: 'GBP/USD' },
  { name: 'AUD/USD' },
  { name: 'USD/CHF' },
];

export type generalAlertType = {
  currencyPair: string,
  alertType: string,
  triggerPrice: string,
  status: string,
  notificationPreferences: {
    email: boolean,
    push: boolean
  },
  id?: string,
  createdAt?: any
}

export type State = {
  currentUser: User | null,
  userProfileName: string | null,
  hasSetAvatar: boolean,
  avatarId: number | null,
  pwaPromptDismissed: boolean,
  authLoading: boolean,
  alerts: {
    previous: generalAlertType[],
    active: generalAlertType[]
  },
  newAlert: generalAlertType,
  showAlertInfo: boolean,
  currentInfo: generalAlertType | null,
  topPairsLivePrices: Record<string, { ask: string, bid: string, timestamp: number | null }>,
  topPairsWsInstance: WebSocket | null,
  topPairsWsStatus: WsStatus,
  topPairsWsParams: WsParams | null
}

export type Actions = {
  updateUser: (user: User | null) => void,
  updateUserProfileName: (name: string | null) => void,
  updateHasSetAvatar: (status: boolean) => void,
  updateAvatarId: (id: number | null) => void,
  updatePwaPromptDismissed: (status: boolean) => void,
  setAuthLoading: (loading: boolean) => void,
  updateActiveAlerts: (newAlerts: generalAlertType[]) => void,
  updatePreviousAlerts: (newAlerts: generalAlertType[]) => void,
  updateShowAlertInfo: (toShow: boolean) => void,
  updateCurrentInfo: (info: generalAlertType | null) => void,
  updateNewAlert: (alert: Partial<generalAlertType>) => void,
  removeAlertFromLists: (alertId: string) => void,
  updateAlertInLists: (updatedAlert: generalAlertType) => void,
  updateTopPairLivePrice: (pair: string, priceData: { ask: string, bid: string, timestamp: number | null }) => void,
  initTopPairsWebSocket: () => void,
  closeTopPairsWebSocket: () => void,
  reconnectTopPairsWebSocket: () => void
}

export const useGeneralAppStore = create<State & Actions>((set, get) => ({
  currentUser: null,
  userProfileName: null,
  hasSetAvatar: false,
  avatarId: null,
  pwaPromptDismissed: false,
  authLoading: true,
  alerts: {
    previous: [],
    active: []
  },
  newAlert: {
    currencyPair: '',
    triggerPrice: '',
    alertType: '',
    status: 'active',
    notificationPreferences: { email: true, push: false }
  },
  showAlertInfo: false,
  currentInfo: null,
  topPairsLivePrices: {},
  topPairsWsInstance: null,
  topPairsWsStatus: 'disconnected',
  topPairsWsParams: null,
  updateUser: (user: User | null) => set({ currentUser: user }),
  updateUserProfileName: (name: string | null) => set({ userProfileName: name }),
  updateHasSetAvatar: (status: boolean) => set({ hasSetAvatar: status }),
  updateAvatarId: (id: number | null) => set({ avatarId: id }),
  updatePwaPromptDismissed: (status: boolean) => set({ pwaPromptDismissed: status }),
  setAuthLoading: (loading: boolean) => set({ authLoading: loading }),
  updateActiveAlerts: (newAlerts: generalAlertType[]) =>
    set((state) => ({ alerts: { ...state.alerts, active: newAlerts } })),
  updatePreviousAlerts: (newAlerts: generalAlertType[]) =>
    set((state) => ({ alerts: { ...state.alerts, previous: newAlerts } })),
  updateShowAlertInfo: (toShow: boolean) => set({ showAlertInfo: toShow }),
  updateCurrentInfo: (info: generalAlertType | null) => set({ currentInfo: info }),
  updateNewAlert: (alert: Partial<generalAlertType>) =>
    set((state) => ({ newAlert: { ...state.newAlert, ...alert } })),
  removeAlertFromLists: (alertId: string) =>
    set((state) => ({
      alerts: {
        active: state.alerts.active.filter(alert => alert.id !== alertId),
        previous: state.alerts.previous.filter(alert => alert.id !== alertId),
      }
    })),
  updateAlertInLists: (updatedAlert: generalAlertType) =>
    set((state) => {
      const newStatus = updatedAlert.status;
      let newActive = [...state.alerts.active];
      let newPrevious = [...state.alerts.previous];

      // Remove from both lists first to handle status changes between active/previous categories
      newActive = newActive.filter(a => a.id !== updatedAlert.id);
      newPrevious = newPrevious.filter(a => a.id !== updatedAlert.id);

      // Add to the correct list based on new status
      if (newStatus === 'active' || newStatus === 'paused') { // Paused alerts are now in the active list
        newActive.push(updatedAlert);
        // Re-sort active list by createdAt (descending)
        newActive.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      } else if (['triggered', 'cancelled'].includes(newStatus)) { // Previous list only for triggered/cancelled
        newPrevious.push(updatedAlert);
        // Re-sort previous list by createdAt (descending)
        newPrevious.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      }

      // Ensure limits are respected after update - these might need adjustment based on typical numbers
      newActive = newActive.slice(0, 10);
      newPrevious = newPrevious.slice(0, 5);

      return {
        alerts: {
          active: newActive,
          previous: newPrevious,
        },
        // Also update currentInfo if the updated alert is the one being viewed
        currentInfo: state.currentInfo?.id === updatedAlert.id ? updatedAlert : state.currentInfo
      };
    }),
  updateTopPairLivePrice: (pair: string, priceData: { ask: string, bid: string, timestamp: number | null }) =>
    set((state) => ({
      topPairsLivePrices: {
        ...state.topPairsLivePrices,
        [pair]: priceData,
      },
    })),
  initTopPairsWebSocket: () => {
    if (get().topPairsWsInstance && get().topPairsWsInstance!.readyState < WebSocket.CLOSING) {
      console.log('[Store initTopPairsWebSocket] WebSocket already exists or is connecting/open.');
      // Optional: If 'connected' but not 'subscribed', maybe re-send subscription
      // if (get().topPairsWsStatus === 'connected') { 
      //   const pairsToSubscribe = initialTopPairsList.map(p => p.name.replace('/', ''));
      //   get().topPairsWsInstance!.send(JSON.stringify({ "pairs": pairsToSubscribe }));
      // }
      return;
    }
    if (!import.meta.env.VITE_XCHANGE_API) {
      console.warn("[Store initTopPairsWebSocket] XCHANGE_API key not found. Live prices disabled.");
      set({ topPairsWsStatus: 'disconnected' });
      initialTopPairsList.forEach(pair => {
        get().updateTopPairLivePrice(pair.name, { ask: 'N/A', bid: 'N/A', timestamp: null });
      });
      return;
    }

    console.log("[Store initTopPairsWebSocket] Initializing new WebSocket for top pairs");
    set({ topPairsWsStatus: 'connecting' });
    initialTopPairsList.forEach(pair => {
      get().updateTopPairLivePrice(pair.name, { ask: 'Loading...', bid: 'Loading...', timestamp: null });
    });

    const newSocket = new WebSocket(`wss://api.xchangeapi.com/websocket/live?api-key=${import.meta.env.VITE_XCHANGE_API}`);

    newSocket.onopen = () => {
      if (newSocket.readyState === WebSocket.OPEN) {
        console.log("[Store WebSocket.onopen] WebSocket connected");
        set({ topPairsWsStatus: 'connected', topPairsWsInstance: newSocket });
        const pairsToSubscribe = initialTopPairsList.map(p => p.name.replace('/', ''));
        newSocket.send(JSON.stringify({ "pairs": pairsToSubscribe }));
      } else {
        console.log("[Store WebSocket.onopen] WebSocket not ready, state:", newSocket.readyState);
      }
    };

    newSocket.onmessage = (event) => {
      const message = event.data as string;
      const messageCode = message.substring(0, 1);
      const messageBody = message.substring(1);
      try {
        if (messageCode === '0') {
          const initialData = JSON.parse(messageBody);
          set({
            topPairsWsParams: {
              mapping: initialData.mapping,
              order: initialData.order,
              startTime: initialData.start_time,
              timeMult: initialData.time_mult,
              sessionUID: initialData.session_uid
            },
            topPairsWsStatus: 'subscribed'
          });
          console.log('[Store WebSocket.onmessage] Subscribed, params set:', get().topPairsWsParams);
        } else if (messageCode === '1') {
          const currentWsParams = get().topPairsWsParams;
          if (currentWsParams?.order && currentWsParams.mapping && currentWsParams.startTime && currentWsParams.timeMult) {
            const parts = messageBody.split('|');
            const update: Record<string, string | number> = {};
            currentWsParams.order.forEach((key, index) => { update[key] = parts[index]; });
            const pairId = update.name as string;
            const pairName = currentWsParams.mapping[pairId];

            const originalPair = initialTopPairsList.find(p => p.name.replace('/', '') === pairName);
            if (originalPair) {
              const ask = update.ask as string;
              const bid = update.bid as string;
              const relativeTime = parseFloat(update.time as string);
              const fullTimestamp = currentWsParams.startTime + (relativeTime / currentWsParams.timeMult);
              get().updateTopPairLivePrice(originalPair.name, { ask, bid, timestamp: fullTimestamp });
            }
          }
        } else if (messageCode === '7' || messageCode === '9') {
          const errorData = JSON.parse(messageBody);
          console.error('[Store WebSocket.onmessage] Error Message:', errorData);
          set({ topPairsWsStatus: 'error' });
          initialTopPairsList.forEach(pair => {
            get().updateTopPairLivePrice(pair.name, { ask: 'Error', bid: 'Error', timestamp: null });
          });
        }
      } catch (e) {
        console.error('[Store WebSocket.onmessage] Error processing message:', e);
      }
    };

    newSocket.onerror = (error) => {
      console.error("[Store WebSocket.onerror] WebSocket error:", error);
      set({ topPairsWsStatus: 'error' });
      initialTopPairsList.forEach(pair => {
        get().updateTopPairLivePrice(pair.name, { ask: 'Error', bid: 'Error', timestamp: null });
      });
    };

    newSocket.onclose = (event) => {
      console.log("[Store WebSocket.onclose] WebSocket disconnected:", event.reason, "Code:", event.code);
      set(state => ({
        topPairsWsInstance: state.topPairsWsInstance === newSocket ? null : state.topPairsWsInstance, // only nullify if it's the current one
        topPairsWsStatus: 'disconnected',
        topPairsWsParams: null
      }));
      if (event.code !== 1000) { // 1000 is normal closure (e.g. by closeTopPairsWebSocket)
        initialTopPairsList.forEach(pair => {
          get().updateTopPairLivePrice(pair.name, { ask: 'Offline', bid: 'Offline', timestamp: null });
        });
      }
    };
  },
  closeTopPairsWebSocket: () => {
    const ws = get().topPairsWsInstance;
    if (ws && ws.readyState < WebSocket.CLOSING) {
      console.log('[Store closeTopPairsWebSocket] Closing WebSocket.');
      ws.close(1000, "User action: Closing WebSocket from store"); // Normal closure
    }
    // State update will be handled by onclose listener
    // Setting status to disconnected immediately might be good for UI responsiveness
    set({
      topPairsWsStatus: 'disconnected',
      topPairsWsInstance: null, // Proactively set to null
      topPairsWsParams: null
    });
    // Clear prices when explicitly closing, or set to a specific state like 'Offline'
    initialTopPairsList.forEach(pair => {
      get().updateTopPairLivePrice(pair.name, { ask: '-', bid: '-', timestamp: null });
    });
  },
  reconnectTopPairsWebSocket: () => {
    console.log('[Store reconnectTopPairsWebSocket] User requested WebSocket reconnect.');
    get().closeTopPairsWebSocket();
    // A slight delay can be useful to allow the 'close' operation to complete fully
    // before the 'init' operation begins, preventing potential race conditions.
    setTimeout(() => {
      get().initTopPairsWebSocket();
    }, 100);
  }
}));
