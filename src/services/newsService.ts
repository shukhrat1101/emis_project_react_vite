import axiosInstance from "./axiosInstance";

export type NewsImage = string | { id?: number; image?: string; url?: string };

export type News = {
    journal_file_url: string | undefined;
    id: number;
    category: number;
    category_name?: string;
    title: string;
    content: string;
    journal_file: string | null;
    created_at: string;
    main_image: string | null;
    additional_images?: NewsImage[];
};

export type NewsCreate = {
    category: number | string;
    title: string;
    content: string;
    journal_file?: File | null;
    additional_images?: File[] | FileList | null;
};

export type NewsUpdate = Partial<NewsCreate>;

export type ListParams = {
    page?: number;
    page_size?: number;
    search?: string;
};

const BASE = "/news";

const toFD = (p: NewsCreate | NewsUpdate) => {
    const fd = new FormData();
    if (p.category !== undefined) fd.append("category", String(p.category));
    if (typeof p.title === "string") fd.append("title", p.title);
    if (typeof p.content === "string") fd.append("content", p.content);
    if (p.journal_file instanceof File) fd.append("journal_file", p.journal_file);
    if (p.additional_images) {
        const files = Array.from(p.additional_images as FileList | File[]);
        files.forEach((f) => f instanceof File && fd.append("additional_images", f));
    }
    return fd;
};

const postMultipart = <T,>(url: string, fd: FormData) =>
    axiosInstance.post<T>(url, fd, {
        transformRequest: [(d) => d],
        headers: { "Content-Type": "multipart/form-data" },
    });

const patchMultipart = <T,>(url: string, fd: FormData) =>
    axiosInstance.patch<T>(url, fd, {
        transformRequest: [(d) => d],
        headers: { "Content-Type": "multipart/form-data" },
    });

async function listByCategory(categoryId: number | string, params?: ListParams): Promise<News[]> {
    const { data } = await axiosInstance.get<News[]>(`${BASE}/${categoryId}/list/` , { params });
    return data;
}


async function listByCategoryInfo(categoryId: number | string , params?: ListParams): Promise<News[]> {
    const { data } = await axiosInstance.get<News[]>(`${BASE}/${categoryId}/list/info/` , { params } );
    return data;
}

export async function list(params?: ListParams) {
    const { data } = await axiosInstance.get(`${BASE}/`, { params });
    return data;
}

export async function retrieve(id: number | string) {
    const { data } = await axiosInstance.get<News>(`${BASE}/${id}/`);
    return data;
}

async function create(payload: NewsCreate): Promise<News> {
    const { data } = await postMultipart<News>(`${BASE}/create/`, toFD(payload));
    return data;
}

async function update(id: number | string, payload: NewsUpdate): Promise<News> {
    const { data } = await patchMultipart<News>(`${BASE}/update/${id}/`, toFD(payload));
    return data;
}

async function remove(id: number | string): Promise<void> {
    await axiosInstance.delete(`${BASE}/delete/${id}/`);
}

export default { list, listByCategory,listByCategoryInfo, retrieve, create, update, remove };
