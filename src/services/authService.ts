// src/services/authService.ts
import axiosInstance from "./axiosInstance";

const setAuthData = (access: string, refresh?: string, user_id?: number, username?: string, role?: string) => {
    localStorage.setItem("token", access);
    if (refresh) localStorage.setItem("refresh", refresh);
    if (user_id != null) localStorage.setItem("user_id", String(user_id));
    if (username) localStorage.setItem("username", username);
    if (role) localStorage.setItem("role", role);
};

const clearAuthData = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
};

export const login = async (username: string, password: string) => {
    try {
        const res = await axiosInstance.post(
            "/user/login/",
            { username, password },
            { __skipAuthRedirect: true } as any
        );

        const payload = res.data?.data ?? res.data ?? {};
        const rawAccess = payload.access ?? payload.token ?? payload.access_token ?? null;
        if (!rawAccess) throw new Error("Access token topilmadi");

        const access = typeof rawAccess === "string" && rawAccess.startsWith("Bearer ")
            ? rawAccess.slice(7)
            : rawAccess;

        const refresh = payload.refresh ?? null;
        const user_id = payload.user_id ?? null;
        const name = payload.username ?? username;
        const role = payload.role ?? null;

        localStorage.setItem("token", access);
        if (refresh) localStorage.setItem("refresh", refresh);
        if (user_id != null) localStorage.setItem("user_id", String(user_id));
        if (name) localStorage.setItem("username", name);
        if (role) localStorage.setItem("role", role);

        return payload;
    } catch (error: any) {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user_id");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
        const data = error?.response?.data;
        const msg =
            data?.detail ||
            data?.message ||
            (typeof data === "string" ? data : null) ||
            "Foydalanuvchi nomi yoki parol xato!";
        throw new Error(msg);
    }
};

export const logout = async () => {
    try {
        const refresh = localStorage.getItem("refresh");
        if (refresh) {
            await axiosInstance.post("/user/logout/", { refresh }, { __skipAuthRedirect: true } as any);
        }
    } catch {}
    clearAuthData();
    window.location.href = "/";
};
