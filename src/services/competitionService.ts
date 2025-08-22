import axiosInstance from "./axiosInstance";

export interface Competition {
    id: number;
    type: string;
    lesson: string;
    competition_place: string;
    start_date: string;
    end_date: string;
    teaching_year: string | number | null;
}

export interface CompetitionPayload {
    type: string;
    lesson: string;
    competition_place: string;
    start_date: string;
    end_date: string;
    teaching_year?: string | number | null;
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
    type?: string;
    year?: string;
}

const BASE = "/competition/competition/";

async function list(page: number, page_size?: number): Promise<Paginated<Competition>>;
async function list(params: ListParams): Promise<Paginated<Competition>>;

async function list(a: number | ListParams = 1, b: number = 10) {
    let params: Record<string, any>;

    if (typeof a === "number") {
        params = { page: a, page_size: b };
    } else {
        const {
            page = 1,
            page_size = 10,
            search,
            type,
            year,
        } = a || {};
        params = { page, page_size };
        if (search) params.search = search;
        if (type) params.type = type;
        if (year) params.year = year;
    }

    const { data } = await axiosInstance.get<Paginated<Competition>>(
        `${BASE}list/`,
        { params }
    );
    return data;
}

async function create(payload: CompetitionPayload) {
    const { data } = await axiosInstance.post<Competition>(`${BASE}create/`, payload);
    return data;
}

async function update(id: number, payload: CompetitionPayload) {
    const { data } = await axiosInstance.put<Competition>(`${BASE}update/${id}/`, payload);
    return data;
}

async function _delete(id: number) {
    const { data } = await axiosInstance.delete(`${BASE}delete/${id}/`);
    return data;
}

const competitionService = { list, create, update, delete: _delete };
export default competitionService;
