import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
    const error: any = useRouteError();

    return (
        <div id="error-page" className="flex font-poppins flex-col items-center justify-center gap-6 dynamicHeight">
            <h1 className="font-bold text-[2rem]">Oops!</h1>
            <p>Sorry, an unexpected error has occurred.</p>
            <p>
                <i>{error.statusText || error.message}</i>
            </p>
        </div>
    );
}