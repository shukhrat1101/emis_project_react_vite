import axiosInstance from "./axiosInstance";

export interface CompetitionResult {
  id: number;
  competition: string;
  result_file: string | null;
  summary: string | null;
  suggestions: string | null;
}

export interface CompetitionResultCreatePayload {
  competition: number;
  summary?: string;
  suggestions?: string;
  result_file?: File | Blob;
}

export interface CompetitionResultUpdatePayload {
  competition?: number;
  summary?: string | null;
  suggestions?: string | null;
  result_file?: File | Blob | null;
}

const BASE = "/competition/competition-result";

const competitionResultService = {
  listByCompetition: async (
    competitionId: number | string,
    params?: { page?: number; page_size?: number }
  ): Promise<CompetitionResult[]> => {
    const { data } = await axiosInstance.get<CompetitionResult[]>(
      `${BASE}/${competitionId}/list/`,
      { params }
    );
    return data;
  },

  create: async (
    payload: CompetitionResultCreatePayload
  ): Promise<CompetitionResult> => {
    const fd = new FormData();
    fd.append("competition", String(payload.competition));
    if (payload.summary != null) fd.append("summary", payload.summary);
    if (payload.suggestions != null) fd.append("suggestions", payload.suggestions);
    if (payload.result_file) fd.append("result_file", payload.result_file);

    const { data } = await axiosInstance.post<CompetitionResult>(
      `${BASE}/create/`,
      fd,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },

  update: async (
    id: number | string,
    payload: CompetitionResultUpdatePayload
  ): Promise<CompetitionResult> => {
    const fd = new FormData();
    if (payload.competition != null) fd.append("competition", String(payload.competition));
    if (payload.summary !== undefined) fd.append("summary", payload.summary ?? "");
    if (payload.suggestions !== undefined) fd.append("suggestions", payload.suggestions ?? "");
    if (payload.result_file) {
      fd.append("result_file", payload.result_file);
    }

    const { data } = await axiosInstance.patch<CompetitionResult>(
      `${BASE}/update/${id}/`,
      fd,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },

  delete: async (id: number | string): Promise<void> => {
    await axiosInstance.delete(`${BASE}/delete/${id}/`);
  },
};

export default competitionResultService;
