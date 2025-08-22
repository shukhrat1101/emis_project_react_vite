import axiosInstance from "./axiosInstance";

export interface ServicemanListItem {
  id: number;
  rank: string;
  full_name: string;
  position: string;
  military_unit: string;
  pinfl: string;
}

export interface ServicemanPayload {
  rank: number;
  full_name: string;
  position: string;
  military_unit: number;
  pinfl: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  page_size: number;
  results: T[];
}

export type ServicemanQuery = {
  page?: number;
  page_size?: number;
  search?: string;
  unit_id?: number;
  rank_id?: number;
  ordering?: string;
};

export interface CheckPinflResponse<T = unknown> {
  exists: boolean;
  detail?: string;
  message?: string;
  serviceman?: T | null;
  serviceman_id?: number | null;
}

const BASE = "/shtat_account/military-serviceman";

export const isValidPinfl = (pinfl: string) => /^\d{14}$/.test((pinfl || "").trim());

async function list(
  params: ServicemanQuery = {}
): Promise<PaginatedResponse<ServicemanListItem>> {
  const { data } = await axiosInstance.get<PaginatedResponse<ServicemanListItem>>(
    `${BASE}/list/`,
    { params }
  );
  return data;
}

async function create(payload: ServicemanPayload): Promise<ServicemanListItem> {
  const { data } = await axiosInstance.post<ServicemanListItem>(`${BASE}/create/`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
}

async function update(
  id: number,
  payload: Partial<ServicemanPayload>
): Promise<ServicemanListItem> {
  const { data } = await axiosInstance.patch<ServicemanListItem>(
    `${BASE}/update/${id}/`,
    payload,
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
}

async function remove(id: number): Promise<void> {
  await axiosInstance.delete(`${BASE}/delete/${id}/`);
}

async function checkPinfl(pinfl: string): Promise<CheckPinflResponse<ServicemanListItem>> {
  const body = { pinfl: pinfl?.trim() };
  try {
    const { data } = await axiosInstance.post<CheckPinflResponse<ServicemanListItem>>(
      `${BASE}/check-pinfl/`,
      body,
      { headers: { "Content-Type": "application/json" } }
    );
    return data;
  } catch (err: any) {
    if (err?.response?.status === 405) {
      const { data } = await axiosInstance.get<CheckPinflResponse<ServicemanListItem>>(
        `${BASE}/check-pinfl/`,
        { params: body }
      );
      return data;
    }
    throw err;
  }
}

const servicemanService = {
  list,
  create,
  update,
  remove,
  checkPinfl,
  isValidPinfl,
};

export default servicemanService;
