import axiosInstance from "./axiosInstance";

export type Degree = "Strategik" | "Operativ" | "Taktik" | string;
export type TeachingType = "Tadqiqot" | "O'quv" | string;

export interface TeachingItem {
    id: number;
    teaching_type: TeachingType;
    degree: Degree;
    lesson: string;
    leader: string;
    teaching_place: string;
    start_date: string;
    end_date: string;
    plan: string | null;
    teaching_year: string;
    created_by: string;
}

export interface Paginated<T> {
    total: number;
    page: number;
    page_size: number;
    results: T[];
}

export interface ListParams {
    page?: number;
    page_size?: number;
    search?: string;
    degree?: string;
    year?: string;
    ordering?: "start_date" | "-start_date" | "end_date" | "-end_date";
    created_by?: string;
}

const ENDPOINTS = {
    base: "/teaching/teaching-research",
    researchList: "/teaching/teaching-research/research-list/",
    teachingList: "/teaching/teaching-research/teaching-list/",
};

function buildQuery(params?: ListParams): URLSearchParams | undefined {
    if (!params) return undefined;
    const q = new URLSearchParams();
    if (params.page != null) q.set("page", String(params.page));
    if (params.page_size != null) q.set("page_size", String(params.page_size));
    if (params.search) q.set("search", params.search);
    if (params.degree) q.set("degree", params.degree);
    if (params.year) q.set("year", params.year);
    if (params.ordering) q.set("ordering", params.ordering);
    if (params.created_by) q.set("created_by", params.created_by);
    return q;
}

async function listResearch(params?: ListParams) {
    const sp = buildQuery(params);
    const url = ENDPOINTS.researchList + (sp ? `?${sp.toString()}` : "");
    const { data } = await axiosInstance.get<Paginated<TeachingItem>>(url);
    return data;
}

async function listTeaching(params?: ListParams) {
    const sp = buildQuery(params);
    const url = ENDPOINTS.teachingList + (sp ? `?${sp.toString()}` : "");
    const { data } = await axiosInstance.get<Paginated<TeachingItem>>(url);
    return data;
}

async function getOne(id: number) {
    const { data } = await axiosInstance.get<TeachingItem>(`${ENDPOINTS.base}/${id}/`);
    return data;
}

export default {
    listResearch,
    listTeaching,
    getOne,
};
