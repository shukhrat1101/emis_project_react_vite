import axiosInstance from "./axiosInstance";

export interface Position {
  id: number;
  name: string;
}

export interface ContingentTableForm {
  id: number;
  type: string;
  count_person: number;
  position: Position[];
}

export interface ContingentTable {
  type: string;
  count_person: number;
  position: (string | number)[];
}

export interface Shtat {
  id?: number;
  degree: string;
  contingent_tables: ContingentTable[];
}

export interface ShtatListResponse {
  total: number;
  page: number;
  page_size: number;
  results: Shtat[];
}

export interface ChoiceOption {
  value: string;
  label: string;
}

export interface ShtatSelectContingent {
  type: "Offitser" | "Serjant" | "Xizmatchi" | string;
  count_person: number;
}

export interface ShtatSelectItem {
  id: number;
  degree: string;
  contingent_tables: ShtatSelectContingent[];
}

const BASE_URL = "/catalog/shtat/";

const shtatService = {
  async getAll(page: number = 1, pageSize: number = 10): Promise<ShtatListResponse> {
    const { data } = await axiosInstance.get<ShtatListResponse>(
      `${BASE_URL}list/`,
      { params: { page, page_size: pageSize } }
    );
    return data;
  },



  async getDegrees(): Promise<ChoiceOption[]> {
    const { data } = await axiosInstance.get<ChoiceOption[]>("/catalog/choice/degree/");
    return data;
  },

  async create(data: Shtat): Promise<Shtat> {
    const { data: res } = await axiosInstance.post<Shtat>(`${BASE_URL}create/`, data);
    return res;
  },

  async update(id: number, data: Shtat): Promise<Shtat> {
    const { data: res } = await axiosInstance.put<Shtat>(`${BASE_URL}update/${id}/`, data);
    return res;
  },

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`${BASE_URL}delete/${id}/`);
  },

  async getSelect(): Promise<ShtatSelectItem[]> {
    const { data } = await axiosInstance.get<ShtatSelectItem[]>(`${BASE_URL}select/`);
    return data;
  },

  async getSelectOptions(): Promise<{ value: number; label: string }[]> {
    const list = await shtatService.getSelect();
    return list.map((item) => {
      const counts: Record<string, number> = { Offitser: 0, Serjant: 0, Xizmatchi: 0 };
      item.contingent_tables?.forEach((c) => {
        counts[c.type] = (counts[c.type] ?? 0) + (c.count_person ?? 0);
      });
      const summary = `Offitser: ${counts.Offitser ?? 0}, Serjant: ${counts.Serjant ?? 0}, Xizmatchi: ${counts.Xizmatchi ?? 0}`;
      return { value: item.id, label: `${item.degree} — ${summary}` };
    });
  },
};

export default shtatService;
