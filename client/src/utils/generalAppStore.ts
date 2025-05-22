import { User } from "firebase/auth";
import { create } from "zustand";

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
  currentInfo: generalAlertType | null
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
  updateAlertInLists: (updatedAlert: generalAlertType) => void
}

export const useGeneralAppStore = create<State & Actions>((set) => ({
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
}));
