import { User } from "firebase/auth";
import { create } from "zustand";
import { WsStatus } from "../types/websocket";
import { priceSocket } from "./priceSocket";

// Define initialTopPairs here to be accessible by the store
// This could also be fetched or configured elsewhere in a larger app
const initialTopPairsList = [
  { name: 'EUR/USD' },
  { name: 'GBP/USD' },
  { name: 'AUD/USD' },
  { name: 'USD/CHF' },
  // Crypto
  { name: 'BTC/USD' },
  { name: 'ETH/USD' },
  { name: 'LTC/USD' },
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
  createdAt?: { seconds: number, nanoseconds?: number } | null
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
  topPairsLivePrices: Record<string, { ask: string, bid: string, timestamp: number | null, stale?: boolean, delayed?: boolean, marketOpen?: boolean, source?: string }>,
  topPairsWsStatus: WsStatus
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
  updateTopPairLivePrice: (pair: string, priceData: { ask: string, bid: string, timestamp: number | null, stale?: boolean, delayed?: boolean, marketOpen?: boolean, source?: string }) => void,
  initTopPairsWebSocket: () => void,
  closeTopPairsWebSocket: () => void,
  reconnectTopPairsWebSocket: () => void
}

let unsubscribeTopPairs: (() => void) | null = null;
let unsubscribeTopPairsStatus: (() => void) | null = null;

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
  topPairsWsStatus: 'disconnected',
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
  updateTopPairLivePrice: (pair: string, priceData: { ask: string, bid: string, timestamp: number | null, stale?: boolean, delayed?: boolean, marketOpen?: boolean, source?: string }) =>
    set((state) => ({
      topPairsLivePrices: {
        ...state.topPairsLivePrices,
        [pair]: priceData,
      },
    })),
  initTopPairsWebSocket: () => {
    if (unsubscribeTopPairs) {
      console.log('[Store initTopPairsWebSocket] Top pair subscriptions already active.');
      return;
    }

    console.log('[Store initTopPairsWebSocket] Subscribing to top pairs via the price engine');
    set({ topPairsWsStatus: 'connecting' });
    initialTopPairsList.forEach(pair => {
      get().updateTopPairLivePrice(pair.name, { ask: 'Loading...', bid: 'Loading...', timestamp: null });
    });

    unsubscribeTopPairsStatus = priceSocket.onStatus((status) => {
      set({ topPairsWsStatus: status });
      if (status === 'error') {
        initialTopPairsList.forEach(pair => {
          get().updateTopPairLivePrice(pair.name, { ask: 'Error', bid: 'Error', timestamp: null });
        });
      } else if (status === 'disconnected') {
        initialTopPairsList.forEach(pair => {
          get().updateTopPairLivePrice(pair.name, { ask: 'Offline', bid: 'Offline', timestamp: null });
        });
      }
    });

    unsubscribeTopPairs = priceSocket.subscribeMany(
      initialTopPairsList.map(pair => pair.name),
      (quote) => {
        get().updateTopPairLivePrice(quote.displayPair, {
          ask: quote.ask,
          bid: quote.bid,
          timestamp: quote.timestamp,
          stale: quote.stale,
          delayed: quote.delayed,
          marketOpen: quote.marketOpen,
          source: quote.source
        });
        if (get().topPairsWsStatus !== 'subscribed') {
          set({ topPairsWsStatus: 'subscribed' });
        }
      }
    );
  },
  closeTopPairsWebSocket: () => {
    console.log('[Store closeTopPairsWebSocket] Unsubscribing from top pairs.');
    unsubscribeTopPairs?.();
    unsubscribeTopPairsStatus?.();
    unsubscribeTopPairs = null;
    unsubscribeTopPairsStatus = null;
    set({ topPairsWsStatus: 'disconnected' });
    initialTopPairsList.forEach(pair => {
      get().updateTopPairLivePrice(pair.name, { ask: '-', bid: '-', timestamp: null });
    });
  },
  reconnectTopPairsWebSocket: () => {
    console.log('[Store reconnectTopPairsWebSocket] Re-subscribing to top pairs.');
    get().closeTopPairsWebSocket();
    setTimeout(() => {
      get().initTopPairsWebSocket();
    }, 100);
  }
}));
