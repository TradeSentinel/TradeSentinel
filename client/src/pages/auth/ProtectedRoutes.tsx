import { Navigate } from "react-router-dom"
import { useGeneralAppStore } from "../../utils/generalAppStore";
import { ReactNode } from "react";

export default function ProtectedRoutes({ children }: { children: ReactNode }) {

    const currentUser = useGeneralAppStore((state) => state.currentUser)

    return (
        <>
            {currentUser ? children : <Navigate to='/login' />}
        </>
    )
}