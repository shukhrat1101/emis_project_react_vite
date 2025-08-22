import axiosInstance from "./axiosInstance";

export type Category = {
  id: number;
  name: string;
};

export type CategoryCreate = {
  name: string;
};

export type CategoryUpdate = {
  name: string;
};

const LIST = "/news/category/list/";
const CREATE = "/news/category/create/";
const UPDATE = (id: number | string) => `/news/category/update/${id}/`;
const REMOVE = (id: number | string) => `/news/category/delete/${id}/`;

async function list(): Promise<Category[]> {
  const { data } = await axiosInstance.get<Category[]>(LIST);
  return data;
}

async function create(payload: CategoryCreate): Promise<Category> {
  const { data } = await axiosInstance.post<Category>(CREATE, payload);
  return data;
}

async function update(id: number, payload: CategoryUpdate): Promise<Category> {
  const { data } = await axiosInstance.patch<Category>(UPDATE(id), payload);
  return data;
}

async function remove(id: number): Promise<void> {
  await axiosInstance.delete(REMOVE(id));
}

export default { list, create, update, remove };
