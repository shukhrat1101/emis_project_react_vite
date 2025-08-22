import axiosInstance from "./axiosInstance";

export interface ChoiceOption {
  value: string;
  label: string;
}

export interface TeachingBranch {
  id: number;
  name: string;
  branch_type: string;
  military_count: number;
  created_by?: number;
  teaching?: number | string;
  teaching_name?: string;
}

export interface TeachingBranchPayload {
  name: string;
  branch_type: string;
  military_count: number;
  teaching: number;
}

export interface Paginated<T> {
  total: number;
  page: number;
  page_size: number;
  results: T[];
}

const TB_BASE = "/teaching/teaching-branch/";
const CHOICE_BASE = "/catalog/choice/";

const teachingBranchService = {
  getBranchTypeOptions: async (): Promise<ChoiceOption[]> => {
    const { data } = await axiosInstance.get<ChoiceOption[]>(
      `${CHOICE_BASE}branch-type/`
    );
    return data;
  },

  list: async (page = 1, page_size = 10) => {
    const { data } = await axiosInstance.get<Paginated<TeachingBranch>>(
      `${TB_BASE}list/`,
      { params: { page, page_size } }
    );
    return data;
  },

  listByTeaching: async (teachingId: number, page = 1, page_size = 10) => {
    const { data } = await axiosInstance.get<Paginated<TeachingBranch>>(
      `${TB_BASE}${teachingId}/list/`,
      { params: { page, page_size } }
    );
    return data;
  },

  create: async (payload: TeachingBranchPayload) => {
    const { data } = await axiosInstance.post<TeachingBranch>(
      `${TB_BASE}create/`,
      payload
    );
    return data;
  },

  update: async (id: number, payload: TeachingBranchPayload) => {
    const { data } = await axiosInstance.put<TeachingBranch>(
      `${TB_BASE}update/${id}/`,
      payload
    );
    return data;
  },

  delete: async (id: number) => {
    const { data } = await axiosInstance.delete(`${TB_BASE}delete/${id}/`);
    return data;
  },
};

export default teachingBranchService;
