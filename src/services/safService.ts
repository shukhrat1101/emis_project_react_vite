import axiosInstance from "./axiosInstance";

export type PartOfDepartment = {
    id: number;
    name: string;
    department: string;
    type: string;
    department_id?: number;
    shtat?: { off_count: number; ser_count: number; emp_count: number };
};

export type SafReason = { id: number; full_name: string; reason: string };

export type SafAbsents = {
    id: number;
    off_count: number;
    ser_count: number;
    employee_count: number;
    total: number;
    reasons: SafReason[];
} | null;

export type SafVacancies = {
    id: number;
    off_count: number;
    ser_count: number;
    employee_count: number;
    total: number;
} | null;

export type SafItem = {
    id: number;
    date: string;
    part_of_department: PartOfDepartment;
    list_off_count: number;
    list_ser_count: number;
    list_employee_count: number;
    list_total: number;
    inline_off_count: number;
    inline_ser_count: number;
    inline_employee_count: number;
    inline_total: number;
    absents: SafAbsents;
    vacancies: SafVacancies;
    created_by: { id: number; username: string } | null;
};

export type Paginated<T> = { total: number; page: number; page_size: number; results: T[] };

export type SafListParams = {
    page?: number;
    page_size?: number;
    part_of_department?: number;
    date?: string;
    ordering?: string;
    search?: string;
};

export type SafCreatePayload = {
    date: string;
    part_of_department?: number;
    list_off_count: number;
    list_ser_count: number;
    list_employee_count: number;
    temporary_absents: {
        off_count: number;
        ser_count: number;
        employee_count: number;
        reasons: { biografic_data: number; reason: string }[];
    };
};

export type BioSelectItem = { id: number; rank?: string; full_name: string; created_by?: number };

const ENDPOINTS = {
    list: "/shtat_account/saf-list/list/",
    byId: (id: number) => `/shtat_account/saf-list/${id}/list/`,
    remove: (id: number) => `/shtat_account/saf-list/delete/${id}/`,
    create: "/shtat_account/saf-list/create/",
    bioSelect: "/shtat_account/bio/select/",
    partsSelect: "/catalog/part-of-department/select-by-degree",
};

function toPaginated<T>(data: any): Paginated<T> {
    if (Array.isArray(data)) {
        const results = data as T[];
        return { total: results.length, page: 1, page_size: results.length, results };
    }
    const results = Array.isArray(data?.results) ? (data.results as T[]) : ([] as T[]);
    const total = typeof data?.total === "number" ? data.total : results.length;
    const page = typeof data?.page === "number" ? data.page : 1;
    const page_size = typeof data?.page_size === "number" ? data.page_size : results.length;
    return { total, page, page_size, results };
}

async function list(params: SafListParams = {}): Promise<Paginated<SafItem>> {
    const { data } = await axiosInstance.get(ENDPOINTS.list, { params });
    return toPaginated<SafItem>(data);
}

async function listById(id: number, params: Omit<SafListParams, "part_of_department"> = {}): Promise<Paginated<SafItem>> {
    const { data } = await axiosInstance.get(ENDPOINTS.byId(id), { params });
    return toPaginated<SafItem>(data);
}

async function remove(id: number): Promise<void> {
    try {
        await axiosInstance.delete(ENDPOINTS.remove(id));
    } catch (err: any) {
        if (err?.response?.status === 405) {
            await axiosInstance.post(ENDPOINTS.remove(id));
            return;
        }
        throw err;
    }
}

async function create(payload: SafCreatePayload): Promise<SafItem> {
    const { data } = await axiosInstance.post<SafItem>(ENDPOINTS.create, payload);
    return data;
}

async function bioSelect(): Promise<BioSelectItem[]> {
    const { data } = await axiosInstance.get<BioSelectItem[]>(ENDPOINTS.bioSelect);
    return Array.isArray(data) ? data : [];
}

async function getPartOfDepartments(): Promise<PartOfDepartment[]> {
    const { data } = await axiosInstance.get<PartOfDepartment[]>(ENDPOINTS.partsSelect);
    return Array.isArray(data) ? data : [];
}

const safService = { list, listById, remove, create, bioSelect, getPartOfDepartments };
export default safService;
