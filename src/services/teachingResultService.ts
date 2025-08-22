import axiosInstance from "./axiosInstance";

export interface TeachingResult {
  id: number;
  teaching_name?: string;
  overall_score?: string | null;
  summary: string;
  suggestions: string;
  created_by?: string | number;
}

export interface TeachingResultPayload {
  teaching: number;
  overall_score?: File | null;
  summary: string;
  suggestions: string;
}

export type TeachingResultCreate = Omit<TeachingResultPayload, "teaching">;

const TR_BASE = "/teaching/teaching-result/";

const postMultipart = <T,>(url: string, body: FormData) =>
  axiosInstance.post<T>(url, body, {
    headers: { "Content-Type": "multipart/form-data" },
    transformRequest: [(d) => d],
  });

const patchMultipart = <T,>(url: string, body: FormData) =>
  axiosInstance.patch<T>(url, body, {
    headers: { "Content-Type": "multipart/form-data" },
    transformRequest: [(d) => d],
  });

const teachingResultService = {
  getOneByTeaching: async (teachingId: number): Promise<TeachingResult | null> => {
    const { data } = await axiosInstance.get<TeachingResult[]>(
      `${TR_BASE}${teachingId}/list/`
    );
    return Array.isArray(data) && data.length ? data[0] : null;
  },

  createIfAbsent: async (teachingId: number, payload: TeachingResultCreate) => {
    const existing = await teachingResultService.getOneByTeaching(teachingId);
    if (existing) {
      const err = new Error("Result already exists for this teaching.");
      (err as any).code = "ALREADY_EXISTS";
      throw err;
    }
    const fd = new FormData();
    fd.append("teaching", String(teachingId));
    fd.append("summary", payload.summary ?? "");
    fd.append("suggestions", payload.suggestions ?? "");
    if (payload.overall_score instanceof File) {
      fd.append("overall_score", payload.overall_score);
    }
    const { data } = await postMultipart<TeachingResult>(`${TR_BASE}create/`, fd);
    return data;
  },

  update: async (id: number, payload: FormData | Partial<Omit<TeachingResultPayload, "teaching">>) => {
    const fd = payload instanceof FormData ? payload : new FormData();

    if (!(payload instanceof FormData)) {
      if (typeof payload.summary === "string") fd.append("summary", payload.summary);
      if (typeof payload.suggestions === "string") fd.append("suggestions", payload.suggestions);
      if (payload.overall_score instanceof File) fd.append("overall_score", payload.overall_score);
    } else {
      fd.delete("teaching");
      const hasFile = Array.from(fd.keys()).includes("overall_score");
      if (!hasFile) fd.delete("overall_score");
    }

    const { data } = await patchMultipart<TeachingResult>(`${TR_BASE}update/${id}/`, fd);
    return data;
  },

  delete: async (id: number) => {
    const { data } = await axiosInstance.delete(`${TR_BASE}delete/${id}/`);
    return data;
  },

  getScoreFilename: (url?: string | null) => {
    if (!url) return "";
    try {
      const name = url.split("/").pop() || "";
      return decodeURIComponent(name);
    } catch {
      return url ?? "";
    }
  },
  getScoreDisplay: (url?: string | null, max = 28) => {
    const name = teachingResultService.getScoreFilename(url);
    if (!name) return "—";
    return name.length > max ? name.slice(0, max) + "…" : name;
  },
  getSuggestedDownloadName: (url?: string | null) => {
    const name = teachingResultService.getScoreFilename(url);
    return name || "overall_score";
  },
};

export default teachingResultService;
