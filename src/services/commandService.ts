import axiosInstance from "./axiosInstance";
import type { AxiosRequestConfig } from "axios";

export interface CommandDoc {
    id: number;
    name: string;
    number: string;
    created_at: string;
    author: string;
    command_url?: string | null;
}

export interface CommandPayload {
    name: string;
    number: string;
    created_at: string;
    author: string;
    command_url?: File | null;
}

export interface Paginated<T> {
    total: number;
    page: number;
    page_size: number;
    results: T[];
}

const BASE = "/document/command/";

const isFormData = (v: unknown): v is FormData =>
    typeof FormData !== "undefined" && v instanceof FormData;

function toFormData(payload: CommandPayload | FormData): FormData {
    if (isFormData(payload)) return payload;
    const fd = new FormData();
    fd.append("name", payload.name ?? "");
    fd.append("number", payload.number ?? "");
    fd.append("created_at", payload.created_at ?? "");
    fd.append("author", payload.author ?? "");
    if (payload.command_url instanceof File) {
        fd.append("command_url", payload.command_url);
    }
    return fd;
}

const multipartCfg: AxiosRequestConfig = {
    transformRequest: (data) => data,
};

const commandService = {
    list: async (page = 1, page_size = 10, search?: string) => {
        const { data } = await axiosInstance.get<Paginated<CommandDoc>>(
            `${BASE}list/`,
            { params: { page, page_size, search } }
        );
        return data;
    },

    create: async (payload: CommandPayload | FormData) => {
        const body = toFormData(payload);
        const { data } = await axiosInstance.post<CommandDoc>(
            `${BASE}create/`,
            body,
            multipartCfg
        );
        return data;
    },

    update: async (id: number, payload: CommandPayload | FormData) => {
        const body = toFormData(payload);
        const { data } = await axiosInstance.put<CommandDoc>(
            `${BASE}update/${id}/`,
            body,
            multipartCfg
        );
        return data;
    },

    delete: async (id: number) => {
        const { data } = await axiosInstance.delete(`${BASE}delete/${id}/`);
        return data;
    },

    getFileFilename: (url?: string | null) => {
        if (!url) return "";
        try {
            const name = url.split("/").pop() || "";
            return decodeURIComponent(name);
        } catch {
            return url;
        }
    },

    getFileDisplay: (url?: string | null, max = 28) => {
        const name = commandService.getFileFilename(url);
        if (!name) return "—";
        return name.length > max ? name.slice(0, max) + "…" : name;
    },

    getSuggestedDownloadName: (url?: string | null) => {
        const name = commandService.getFileFilename(url);
        return name || "command_file";
    },
};

export default commandService;
