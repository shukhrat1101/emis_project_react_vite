import axiosInstance from "./axiosInstance";

export type Certificate = {
  id: number;
  sertification_number: string;
  sertification_url: string | null;
  issued_at: string | null;
};

const BASE = "/course/certificate/";

export type CertificateQuery = {
  page?: number;
  page_size?: number;
};

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

async function listByEnrollment(
  enrollmentId: number | string,
  params: CertificateQuery = {}
): Promise<Certificate[]> {
  const { data } = await axiosInstance.get(`${BASE}${enrollmentId}/list/`, { params });
  return Array.isArray(data) ? data : (data as any)?.results ?? [];
}

async function getOneByEnrollment(
  enrollmentId: number | string
): Promise<Certificate | null> {
  const list = await listByEnrollment(enrollmentId, { page: 1, page_size: 1 });
  return list[0] ?? null;
}

type CertificateCreateFD = FormData;
type CertificateCreateObj = {
  enrollment: number | string;
  issued_at?: string;
  sertification_number?: string;
  sertification_file?: File;
};

async function create(payload: CertificateCreateFD | CertificateCreateObj): Promise<Certificate> {
  const fd =
    payload instanceof FormData
      ? payload
      : (() => {
          const f = new FormData();
          f.append("enrollment", String(payload.enrollment));
          if (payload.issued_at) f.append("issued_at", payload.issued_at);
          if (payload.sertification_number) f.append("sertification_number", payload.sertification_number);
          if (payload.sertification_file instanceof File) {
            f.append("sertification_file", payload.sertification_file);
          }
          return f;
        })();

  const { data } = await postMultipart<Certificate>(`${BASE}create/`, fd);
  return data;
}

type CertificateUpdateObj = {
  sertification_number?: string;
  sertification_file?: File | null;
};

async function update(
  id: number | string,
  payload: FormData | CertificateUpdateObj
): Promise<Certificate> {
  const fd =
    payload instanceof FormData
      ? (() => {
          payload.delete("enrollment");
          payload.delete("issued_at");
          const hasFile = Array.from(payload.keys()).includes("sertification_file");
          if (!hasFile) payload.delete("sertification_file");
          return payload;
        })()
      : (() => {
          const f = new FormData();
          if (typeof payload.sertification_number === "string") {
            f.append("sertification_number", payload.sertification_number);
          }
          if (payload.sertification_file instanceof File) {
            f.append("sertification_file", payload.sertification_file);
          }
          return f;
        })();

  const { data } = await patchMultipart<Certificate>(`${BASE}update/${id}/`, fd);
  return data;
}

async function remove(id: number | string): Promise<void> {
  await axiosInstance.delete(`${BASE}delete/${id}/`);
}

function getFileName(url: string) {
  try {
    const u = new URL(url);
    return decodeURIComponent(u.pathname.split("/").pop() || "");
  } catch {
    return url.split("/").pop() || url;
  }
}

export default {
  listByEnrollment,
  getOneByEnrollment,
  create,
  update,
  remove,
  getFileName,
};
