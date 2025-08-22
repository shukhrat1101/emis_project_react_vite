import axiosInstance from "./axiosInstance";

export interface TeachingResearch {
  id: number;
  teaching_type: string;
  degree: string;
  lesson: string;
  leader: string;
  teaching_place: string;
  start_date: string;
  end_date: string;
  plan: string | null;
  teaching_year: string;
  created_by: string;
}

export interface TeachingResearchListResponse {
  total: number;
  page: number;
  page_size: number;
  results: TeachingResearch[];
}

export interface TeachingResearchFilters {
  teaching_year_id?: number | string;
  teaching_type?: string;
  degree?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
  ordering?: string;
}

export type TeachingResearchFormData = FormData;

const BASE_URL = "/teaching/teaching-research/";

const teachResearchService = {
  getAll: async (
    page = 1,
    page_size = 10,
    filters: TeachingResearchFilters = {}
  ): Promise<TeachingResearchListResponse> => {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("page_size", String(page_size));
    if (filters.teaching_year_id != null) qs.set("teaching_year", String(filters.teaching_year_id));
    if (filters.teaching_type) qs.set("teaching_type", filters.teaching_type);
    if (filters.degree) qs.set("degree", filters.degree);
    if (filters.search) qs.set("search", filters.search);
    if (filters.start_date) qs.set("start_date", filters.start_date);
    if (filters.end_date) qs.set("end_date", filters.end_date);
    if (filters.ordering) qs.set("ordering", filters.ordering);

    const res = await axiosInstance.get<TeachingResearchListResponse>(
      `${BASE_URL}list/?${qs.toString()}`
    );
    return res.data;
  },

  create: async (formData: TeachingResearchFormData): Promise<TeachingResearch> => {
    const res = await axiosInstance.post<TeachingResearch>(
      `${BASE_URL}create/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
  },

  update: async (id: number | string, formData: TeachingResearchFormData): Promise<TeachingResearch> => {
    const res = await axiosInstance.patch<TeachingResearch>(
      `${BASE_URL}update/${id}/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
  },

  remove: async (id: number | string): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}delete/${id}/`);
  },


  getPlanFilename: (planUrl: string | null | undefined): string => {
    if (!planUrl) return "plan.doc";
    const decoded = decodeURIComponent(planUrl);
    const parts = decoded.split("/");
    return parts[parts.length - 1] || "plan.doc";
  },

  getPlanDisplay: (planUrl: string | null | undefined, max = 20): string => {
    if (!planUrl) return "Reja fayli";
    let name = teachResearchService.getPlanFilename(planUrl);
    name = name.replace(/^Файл/i, "Fayl");                 // "Файл" → "Fayl"
    name = name.replace(/_[A-Za-z0-9]{5,}(?=\.)/g, "");    // suffixni olib tashlash
    if (name.length > max) {
      const dot = name.lastIndexOf(".");
      const ext = dot !== -1 ? name.slice(dot) : "";
      const base = dot !== -1 ? name.slice(0, dot) : name;
      const cut = base.slice(0, Math.max(3, max - ext.length - 1));
      name = `${cut}…${ext}`;
    }
    return name;
  },

  getSuggestedDownloadName: (planUrl: string | null | undefined): string => {
    const raw = teachResearchService.getPlanFilename(planUrl || "");
    const ext = raw.includes(".") ? raw.slice(raw.lastIndexOf(".") + 1).toLowerCase() : "docx";
    return `reja.${ext}`;
  },

  toFormData: (payload: Record<string, any>): FormData => {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (v instanceof File || v instanceof Blob) fd.append(k, v);
      else fd.append(k, String(v));
    });
    return fd;
  },
};

export default teachResearchService;
