import axiosInstance from "./axiosInstance";

export interface TeachingYear {
  id: number;
  start_year: number;
  end_year: number;
}

export interface TeachingYearCreate {
  start_year: number;
  end_year: number;
}

export interface TeachingYearUpdate {
  start_year?: number;
  end_year?: number;
}

export interface SelectOption {
  value: number | string;
  label: string;
}


const BASE_URL = "/teaching/teaching-year/";

const teachYearService = {
  getAll: async (): Promise<TeachingYear[]> => {
    const res = await axiosInstance.get<TeachingYear[]>(BASE_URL);
    return res.data;
  },



  create: async (payload: TeachingYearCreate): Promise<TeachingYear> => {
    if (payload.start_year >= payload.end_year) {
      throw new Error("start_year end_year’dan kichik bo‘lishi kerak.");
    }
    const res = await axiosInstance.post<TeachingYear>(BASE_URL, payload);
    return res.data;
  },

  update: async (
    id: number | string,
    payload: TeachingYearUpdate,
    method: "put" | "patch" = "patch"
  ): Promise<TeachingYear> => {
    if (
      payload.start_year !== undefined &&
      payload.end_year !== undefined &&
      payload.start_year >= payload.end_year
    ) {
      throw new Error("start_year end_year’dan kichik bo‘lishi kerak.");
    }

    const url = `${BASE_URL}${id}/`;
    const res =
      method === "put"
        ? await axiosInstance.put<TeachingYear>(url, payload)
        : await axiosInstance.patch<TeachingYear>(url, payload);

    return res.data;
  },

  remove: async (id: number | string): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}${id}/`);
  },

  getSelectOptions: async (): Promise<SelectOption[]> => {
    const list = await teachYearService.getAll();
    return list.map((y) => ({
      value: y.id,
      label: `${y.start_year}–${y.end_year}`,
    }));
  },

  getCurrentTeachingYear: async (today = new Date()): Promise<TeachingYear | null> => {
    const years = await teachYearService.getAll();
    if (!years.length) return null;

    const y = today.getFullYear();
    const found = years.find((t) => y >= t.start_year && y <= t.end_year) || null;
    return found;
  },

  validate: (start_year?: number, end_year?: number): string | null => {
    if (start_year == null || end_year == null) return "Ikkala yil ham kiritilishi kerak.";
    if (!Number.isInteger(start_year) || !Number.isInteger(end_year)) return "Yillar butun son bo‘lishi kerak.";
    if (start_year < 1900 || end_year < 1900) return "Yillar 1900 dan katta bo‘lishi kerak.";
    if (start_year >= end_year) return "Boshlangan sana  tugash sanadan kichik bo‘lishi kerak.";
    return null;
  },
};

export default teachYearService;
