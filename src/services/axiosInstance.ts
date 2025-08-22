// src/services/axiosInstance.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

type ExtConfig = InternalAxiosRequestConfig & { __skipAuthRedirect?: boolean };

function serializeParams(params: Record<string, any>): string {
    const usp = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
        if (v == null) return;
        if (Array.isArray(v)) v.forEach((val) => usp.append(k, String(val)));
        else usp.append(k, String(v));
    });
    return usp.toString().replace(/%60/g, "`");
}

const AUTH_SCHEME = import.meta.env.VITE_AUTH_SCHEME || "Bearer";

const axiosInstance: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: { "Content-Type": "application/json" },
    timeout: 10000,
    withCredentials: false,
    paramsSerializer: { serialize: serializeParams },
});

axiosInstance.interceptors.request.use(
    (config: ExtConfig): ExtConfig => {
        const raw = localStorage.getItem("token");
        if (raw) {
            const val = raw.startsWith("Bearer ") ? raw : `Bearer ${raw}`;
            (config.headers as any).Authorization = val;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => response,
    (error: AxiosError) => {
        const status = error.response?.status;
        const cfg = (error.config || {}) as ExtConfig;
        const url = (cfg?.url || "").toString();

        const isLoginReq = url.includes("/user/login/");
        const skip = cfg.__skipAuthRedirect === true;

        if (status === 401 && !isLoginReq && !skip) {
            localStorage.removeItem("token");
            localStorage.removeItem("refresh");
            localStorage.removeItem("user_id");
            localStorage.removeItem("username");
            localStorage.removeItem("role");
            window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
