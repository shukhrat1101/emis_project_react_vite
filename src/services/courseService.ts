import axiosInstance from "./axiosInstance";

export interface Course {
    id: number;
    course_name: string;
    course_place: string;
    start_date: string;
    end_date: string;
    course_year: string | number;
    student_count: number;
}

export interface CoursePayload {
    course_name: string;
    course_place: string;
    start_date: string;
    end_date: string;
    course_year: number | string;
    student_count: number;
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
    year?: string;
}

const BASE = "/course/";

async function list(page: number, page_size?: number): Promise<Paginated<Course>>;
async function list(params: ListParams): Promise<Paginated<Course>>;
async function list(a: number | ListParams = 1, b?: number) {
    const params: Record<string, any> = {};
    if (typeof a === "number") {
        params.page = a;
        if (typeof b === "number") params.page_size = b;
    } else {
        if (a.page != null) params.page = a.page;
        if (a.page_size != null) params.page_size = a.page_size;
        if (a.search) params.search = a.search;
        if (a.year) params.year = a.year;
    }
    const { data } = await axiosInstance.get<Paginated<Course>>(`${BASE}list/`, { params });
    return data;
}

async function create(payload: CoursePayload) {
    const { data } = await axiosInstance.post<Course>(`${BASE}create/`, payload);
    return data;
}

async function update(id: number, payload: CoursePayload) {
    const { data } = await axiosInstance.put<Course>(`${BASE}update/${id}/`, payload);
    return data;
}

async function _delete(id: number) {
    const { data } = await axiosInstance.delete(`${BASE}delete/${id}/`);
    return data;
}

const courseService = { list, create, update, delete: _delete };
export default courseService;
