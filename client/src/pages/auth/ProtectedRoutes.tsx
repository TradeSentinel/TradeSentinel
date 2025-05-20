import { Navigate } from "react-router-dom"
import { useGeneralAppStore } from "../../utils/generalAppStore";
import { ReactNode } from "react";
import PageLoader from "../../components/PageLoader";

export default function ProtectedRoutes({ children }: { children: ReactNode }) {
    const currentUser = useGeneralAppStore((state) => state.currentUser)
    const authLoading = useGeneralAppStore((state) => state.authLoading)

    if (authLoading) {
        return (
            <div className="dynamicHeight w-full flex items-center justify-center">
                <PageLoader />
            </div>
        );
    }

    return (
        <>
            {currentUser ? children : <Navigate to='/login' replace />}
        </>
    )
}