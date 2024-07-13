import { create } from "zustand";

export type generalAlertType = {
  currencyPair: string,
  alertType: string,
  triggerPrice: string,
  status: string,
  notification: string
}

export type State = {
  currentUser: null | string,
  alerts: {
    previous: generalAlertType[],
    active: generalAlertType[]
  },
  newAlert: generalAlertType,
  showAlertInfo: boolean,
  currentInfo: generalAlertType | null
}

export type Actions = {
  updateUser: (user: string) => void,
  updateActiveAlerts: (newAlerts: generalAlertType[]) => void,
  updatePreviousAlerts: (newAlerts: generalAlertType[]) => void,
  updateShowAlertInfo: (toShow: boolean) => void
  updateCurrentInfo: (info: generalAlertType) => void,
  updateNewAlert: (alert: generalAlertType) => void
}

export const useGeneralAppStore = create<State & Actions>((set) => ({
  currentUser: "Aydot",
  alerts: {
    previous: [],
    active: []
  },
  updateUser: (user: string) => set({ currentUser: user }),
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
