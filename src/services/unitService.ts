import axiosInstance from "./axiosInstance";

const BASE_URL = "/catalog/department/";

const unitService = {
  getAll: (page: number = 1, pageSize: number = 10) => {
    return axiosInstance.get(`${BASE_URL}?page=${page}&page_size=${pageSize}`);
  },


  create: (data: FormData | object) => {
    return axiosInstance.post(BASE_URL, data, {
      headers: data instanceof FormData
        ? { "Content-Type": "multipart/form-data" }
        : {},
    });
  },

  update: (id: number, data: FormData | object) => {
    return axiosInstance.put(`${BASE_URL}${id}/`, data, {
      headers: data instanceof FormData
        ? { "Content-Type": "multipart/form-data" }
        : {},
    });
  },

  delete: (id: number) => {
    return axiosInstance.delete(`${BASE_URL}${id}/`);
  },

  getAllUnits: async () => {
    const response = await axiosInstance.get(`${BASE_URL}select/`);
    return response.data;
  },
};

export default unitService;
