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
  updatePwaPromptDismissed: (status: boolean) => void,
  setAuthLoading: (loading: boolean) => void,
  updateActiveAlerts: (newAlerts: generalAlertType[]) => void,
  updatePreviousAlerts: (newAlerts: generalAlertType[]) => void,
  updateShowAlertInfo: (toShow: boolean) => void
  updateCurrentInfo: (info: generalAlertType) => void,
  updateNewAlert: (alert: Partial<generalAlertType>) => void
}

export const useGeneralAppStore = create<State & Actions>((set) => ({
  currentUser: null,
  userProfileName: null,
  hasSetAvatar: false,
  pwaPromptDismissed: false,
  authLoading: true,
  alerts: {
    previous: [],
    active: []
  },
  updateUser: (user: User | null) => set({ currentUser: user }),
  updateUserProfileName: (name: string | null) => set({ userProfileName: name }),
  updateHasSetAvatar: (status: boolean) => set({ hasSetAvatar: status }),
  updatePwaPromptDismissed: (status: boolean) => set({ pwaPromptDismissed: status }),
  setAuthLoading: (loading: boolean) => set({ authLoading: loading }),
  updateActiveAlerts: (newAlerts: generalAlertType[]) => set((state) => ({
    alerts: {
      ...state.alerts,
      active: newAlerts
    }
  })),
  updatePreviousAlerts: (newAlerts: generalAlertType[]) => set((state) => ({
    alerts: {
      ...state.alerts,
      previous: newAlerts
    }
  })),
  showAlertInfo: false,
  updateShowAlertInfo: (toShow: boolean) => set({ showAlertInfo: toShow }),
  currentInfo: null,
  updateCurrentInfo: (info: generalAlertType) => set({ currentInfo: info }),
  newAlert: {
    currencyPair: '',
    triggerPrice: '',
    alertType: '',
    status: 'active',
    notificationPreferences: {
      email: true,
      push: false
    }
  },
  updateNewAlert: (alert: Partial<generalAlertType>) => set((state) => ({
    newAlert: { ...state.newAlert, ...alert }
  }))
}));
