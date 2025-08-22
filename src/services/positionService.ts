import axiosInstance from "./axiosInstance";

const BASE_URL = "/catalog/position/";

export interface ChoiceOption {
    value: number | string;
    label: string;
    type: "off" | "ser" | "emp";
}

type RawSelect =
    | { id: number | string; name: string; type?: "off" | "ser" | "emp" }
    | { value: number | string; label: string; type?: "off" | "ser" | "emp" };

export interface RawListItem {
    id: number | string;
    name: string;
    type: "off" | "ser" | "emp";
}

const positionService = {
    getAll: async (page: number = 1, pageSize: number = 100, search?: string) => {
        const { data } = await axiosInstance.get(`${BASE_URL}list/`, {
            params: { page, page_size: pageSize, search: search?.trim() || undefined },
        });
        return data as {
            results?: RawListItem[];
            count?: number;
            next?: string | null;
            total?: number;
            page?: number;
            page_size?: number;
        };
    },

    getSelectList: async (): Promise<ChoiceOption[]> => {
        try {
            const selRes = await axiosInstance.get(`${BASE_URL}select/`);
            const rawSelect: RawSelect[] = Array.isArray(selRes.data) ? selRes.data : [];
            const normalizedSel = rawSelect.map((item) =>
                "value" in item && "label" in item
                    ? { value: item.value, label: item.label, type: item.type }
                    : { value: (item as any).id, label: (item as any).name, type: (item as any).type }
            );
            const hasTypeInSelect = normalizedSel.some((s) => !!s.type);
            if (hasTypeInSelect) {
                return normalizedSel.map((s) => ({
                    value: s.value,
                    label: s.label,
                    type: (s.type as "off" | "ser" | "emp") || "emp",
                }));
            }
            const listRes = await axiosInstance.get(`${BASE_URL}list/`, {
                params: { page: 1, page_size: 10000 },
            });
            const listData: RawListItem[] =
                (listRes.data?.results as RawListItem[]) ??
                (Array.isArray(listRes.data) ? (listRes.data as RawListItem[]) : []);
            const idToType = new Map<number | string, "off" | "ser" | "emp">();
            listData.forEach((row) => idToType.set(row.id, row.type));
            return normalizedSel.map((s) => ({
                value: s.value,
                label: s.label,
                type: idToType.get(s.value) || "emp",
            }));
        } catch {
            return [];
        }
    },

    create: async (data: FormData | object) => {
        const config =
            data instanceof FormData
                ? { transformRequest: [(d: any) => d], headers: { "Content-Type": "multipart/form-data" } }
                : {};
        const res = await axiosInstance.post(`${BASE_URL}create/`, data, config as any);
        return res.data;
    },

    update: async (id: number, data: FormData | object) => {
        const config =
            data instanceof FormData
                ? { transformRequest: [(d: any) => d], headers: { "Content-Type": "multipart/form-data" } }
                : {};
        const res = await axiosInstance.put(`${BASE_URL}update/${id}/`, data, config as any);
        return res.data;
    },

    delete: async (id: number) => {
        const res = await axiosInstance.delete(`${BASE_URL}delete/${id}/`);
        return res.data;
    },
};

export default positionService;
