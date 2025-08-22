import axiosInstance from "./axiosInstance";

export type CreatedBy = number | { id: number } | null;

export type BioPerson = {
    id: number;
    photo: string | null;
    position: string;
    rank: string;
    full_name: string;
    position_date: string | null;
    qualfication: string | null;
    ended_courses: string | null;
    been_in_abroad: string | null;
    born_place: string | null;
    born_date: string | null;
    nationality: string | null;
    live_place: string | null;
    phone_number: string | null;
    height: number | null;
    weight: number | null;
    child_count: number | null;
    created_by?: CreatedBy;
};

export type BioGroup = {
    id: number;
    name: string;
    type: string;
    department: string;
    biografic_data_department: BioPerson[];
};

export type FlatBio = BioPerson & {
    group_id: number;
    group_name: string;
    group_type: string;
    department: string;
};

const ENDPOINTS = {
    listAll: "/shtat_account/bio/list/",
    byUnit: (unitId: number) => `/shtat_account/bio/${unitId}/list/`,
    create: "/shtat_account/bio/create/",
    update: (id: number) => `/shtat_account/bio/update/${id}/`,
    remove: (id: number) => `/shtat_account/bio/delete/${id}/`,
};

async function listAll(params?: Record<string, any>): Promise<BioGroup[]> {
    const { data } = await axiosInstance.get<BioGroup[] | { results?: BioGroup[] }>(ENDPOINTS.listAll, { params });
    if (Array.isArray(data)) return data;
    if (data && Array.isArray((data as any).results)) return (data as any).results as BioGroup[];
    return [];
}

async function listByUnit(unitId: number, params?: Record<string, any>): Promise<BioGroup[]> {
    const { data } = await axiosInstance.get<BioGroup[] | { results?: BioGroup[] }>(ENDPOINTS.byUnit(unitId), { params });
    if (Array.isArray(data)) return data;
    if (data && Array.isArray((data as any).results)) return (data as any).results as BioGroup[];
    return [];
}

function normalizePayload(p: any) {
    const data = { ...p };
    if (data.qualification !== undefined && data.qualfication === undefined) {
        data.qualfication = data.qualification;
        delete data.qualification;
    }
    return data;
}

function toFormData(payload: any): FormData {
    const fd = new FormData();
    const data = normalizePayload(payload);
    Object.entries(data).forEach(([k, v]) => {
        if (v === undefined) return;
        if (v instanceof File) fd.append(k, v);
        else if (v === null) fd.append(k, "");
        else fd.append(k, String(v));
    });
    return fd;
}

async function create(payload: any): Promise<BioPerson> {
    const fd = toFormData(payload);
    const { data } = await axiosInstance.post<BioPerson>(ENDPOINTS.create, fd, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
}

async function update(id: number, payload: any): Promise<BioPerson> {
    const fd = toFormData(payload);
    try {
        const { data } = await axiosInstance.patch<BioPerson>(ENDPOINTS.update(id), fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
    } catch (err: any) {
        if (err?.response?.status === 405) {
            const { data } = await axiosInstance.put<BioPerson>(ENDPOINTS.update(id), fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return data;
        }
        throw err;
    }
}

async function remove(id: number): Promise<void> {
    try {
        await axiosInstance.delete(ENDPOINTS.remove(id));
    } catch (err: any) {
        if (err?.response?.status === 405) {
            await axiosInstance.post(ENDPOINTS.remove(id));
            return;
        }
        throw err;
    }
}

function toFlat(groups: BioGroup[]): FlatBio[] {
    if (!Array.isArray(groups)) return [];
    const flat: FlatBio[] = [];
    for (const g of groups) {
        const people = Array.isArray(g.biografic_data_department) ? g.biografic_data_department : [];
        for (const p of people) {
            flat.push({
                ...p,
                group_id: g.id,
                group_name: g.name,
                group_type: g.type,
                department: g.department,
            });
        }
    }
    return flat;
}

function sortGroupsByName(groups: BioGroup[]): BioGroup[] {
    return [...groups].sort((a, b) => a.name.localeCompare(b.name));
}

function sortFlatByFullName(items: FlatBio[]): FlatBio[] {
    return [...items].sort((a, b) => a.full_name.localeCompare(b.full_name));
}

async function getOne(id: number): Promise<BioPerson | null> {
    const groups = await listAll();
    for (const g of groups) {
        const people = Array.isArray(g.biografic_data_department) ? g.biografic_data_department : [];
        for (const p of people) {
            if (p.id === id) return p;
        }
    }
    return null;
}

const bioShtatService = {
    listAll,
    listByUnit,
    create,
    update,
    remove,
    toFlat,
    sortGroupsByName,
    sortFlatByFullName,
    getOne,
};

export default bioShtatService;
