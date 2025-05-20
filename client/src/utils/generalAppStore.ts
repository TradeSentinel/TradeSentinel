import { User } from "firebase/auth";
import { create } from "zustand";

export type generalAlertType = {
  currencyPair: string,
  alertType: string,
  triggerPrice: string,
  status: string,
  notification: string
}

export type State = {
  currentUser: User | null,
  userProfileName: string | null,
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
  updateActiveAlerts: (newAlerts: generalAlertType[]) => void,
  updatePreviousAlerts: (newAlerts: generalAlertType[]) => void,
  updateShowAlertInfo: (toShow: boolean) => void
  updateCurrentInfo: (info: generalAlertType) => void,
  updateNewAlert: (alert: generalAlertType) => void
}

export const useGeneralAppStore = create<State & Actions>((set) => ({
  currentUser: null,
  userProfileName: null,
  alerts: {
    previous: [],
    active: []
  },
  updateUser: (user: User | null) => set({ currentUser: user }),
  updateUserProfileName: (name: string | null) => set({ userProfileName: name }),
  updateActiveAlerts: (newAlert: generalAlertType[]) => set((state) => ({
    alerts: {
      ...state.alerts,
      active: newAlert
    }
  })),
  updatePreviousAlerts: (newAlert: generalAlertType[]) => set((state) => ({
    alerts: {
      ...state.alerts,
      previous: newAlert
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
    status: '',
    notification: ''
  },
  updateNewAlert: (alert: generalAlertType) => set({ newAlert: alert })
}));
