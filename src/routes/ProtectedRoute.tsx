// src/routes/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { me } from "../services/userService";

type Role = "superadmin" | "admin" | "user";
type Props = PropsWithChildren<{ allowed?: Role[] }>;

function isTokenValid(token: string | null) {
    if (!token) return false;
    try {
        const [, payload] = token.split(".");
        const data = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
        const now = Math.floor(Date.now() / 1000);
        return typeof data.exp === "number" ? data.exp > now : true;
    } catch {
        return false;
    }
}

export default function ProtectedRoute({ children, allowed }: Props) {
    const location = useLocation();
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const [status, setStatus] = useState<"checking" | "ok" | "noauth" | "forbidden">("checking");
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;

        if (!isTokenValid(token)) {
            setStatus("noauth");
            return () => { mounted.current = false; };
        }

        const ac = new AbortController();

        (async () => {
            try {
                const user = await me(ac.signal);
                const role = String(user?.role || "").toLowerCase() as Role;
                if (allowed && allowed.length > 0 && !allowed.map(r => r.toLowerCase()).includes(role)) {
                    if (mounted.current) setStatus("forbidden");
                } else {
                    if (mounted.current) setStatus("ok");
                }
            } catch (err: any) {
                // MUHIM: abort/canceled bo‘lsa noauth demaymiz
                const aborted = ac.signal.aborted || err?.code === "ERR_CANCELED" || err?.name === "CanceledError";
                if (!aborted && mounted.current) setStatus("noauth");
            }
        })();

        return () => {
            mounted.current = false;
            ac.abort();
        };
    }, [token, allowed]);

    if (status === "checking") return null;
    if (status === "noauth") return <Navigate to="/" replace state={{ from: location }} />;
    if (status === "forbidden") return <Navigate to="/404" replace />;
    return <>{children}</>;
}
