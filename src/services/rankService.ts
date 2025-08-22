import axiosInstance from "./axiosInstance";

const BASE_URL = "/catalog/rank/";

export interface Rank {
    id: number;
    name: string;
    rank_type?: string;
}

export interface Paginated<T> {
    total: number;
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface RankOption {
    value: number;
    label: string;
}

export interface RankTypeOption {
    value: string;
    label: string;
}

const rankService = {
    getAll: async (
        page: number = 1,
        pageSize: number = 10,
        search?: string
    ): Promise<Paginated<Rank>> => {
        const params: Record<string, any> = { page, page_size: pageSize };
        if (search && search.trim()) params.search = search.trim();

        const res = await axiosInstance.get<Paginated<Rank>>(
            `${BASE_URL}list/`,
            { params }
        );
        return res.data;
    },

    create: async (data: FormData | object): Promise<Rank> => {
        const res = await axiosInstance.post(`${BASE_URL}create/`, data, {
            headers:
                data instanceof FormData
                    ? { "Content-Type": "multipart/form-data" }
                    : undefined,
        });
        return res.data;
    },

    update: async (id: number, data: FormData | object): Promise<Rank> => {
        const res = await axiosInstance.put(`${BASE_URL}update/${id}/`, data, {
            headers:
                data instanceof FormData
                    ? { "Content-Type": "multipart/form-data" }
                    : undefined,
        });
        return res.data;
    },

    delete: async (id: number): Promise<void> => {
        await axiosInstance.delete(`${BASE_URL}delete/${id}/`);
    },

    getRankTypes: async (): Promise<RankTypeOption[]> => {
        const res = await axiosInstance.get<RankTypeOption[]>(
            "/catalog/choice/rank-type/"
        );
        return res.data;
    },

    select: async (params?: {
        page?: number;
        page_size?: number;
        search?: string;
    }): Promise<Paginated<Rank>> => {
        const res = await axiosInstance.get<Paginated<Rank>>(
            `${BASE_URL}list/`,
            { params }
        );
        return res.data;
    },

    getRankSelect: async (): Promise<RankOption[]> => {
        const res = await axiosInstance.get<Rank[]>(`${BASE_URL}select/`);
        return (res.data || []).map((r) => ({ value: r.id, label: r.name }));
    },
};

export default rankService;
