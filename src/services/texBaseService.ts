import axiosInstance from "./axiosInstance";

export type Unit = { id: number; name: string };
export type PartOfDepartment = { id: number; name: string; department?: string };

export type TechItem = {
    id: number;
    part_of_department: string;
    equipment_room: number;
    count_pc_jcats: number;
    configuration: string;
    invitation_solve_problems: string;
    count_person: number;
    photo_reports?: { id?: number; report_thumbnail?: string }[] | string[];
};

export type TechPayload = {
    part_of_department?: number | null;
    equipment_room?: number | string;
    count_pc_jcats?: number | string;
    configuration?: string;
    invitation_solve_problems?: string;
    count_person?: number | string;
    photos?: File[];
};

const ENDPOINTS = {
    units: "/document/unit/select/",
    byUnit: (id: number) => `/document/tex_baza/${id}/list/`,
    mine: "/document/tex_baza/list/",
    partsSelect: "/catalog/part-of-department/select-by-degree",
    create: "/document/tex_baza/create/",
    update: (id: number) => `/document/tex_baza/update/${id}/`,
    delete: (id: number) => `/document/tex_baza/delete/${id}/`,
};

async function getUnits(): Promise<Unit[]> {
    const { data } = await axiosInstance.get<Unit[]>(ENDPOINTS.units);
    return data;
}

async function listByUnit(unitId: number): Promise<TechItem[]> {
    const { data } = await axiosInstance.get<TechItem[]>(ENDPOINTS.byUnit(unitId));
    return data;
}

async function listMine(): Promise<TechItem[]> {
    const { data } = await axiosInstance.get<TechItem[]>(ENDPOINTS.mine);
    return data;
}

async function getPartOfDepartments(): Promise<PartOfDepartment[]> {
    const { data } = await axiosInstance.get<PartOfDepartment[]>(ENDPOINTS.partsSelect);
    return data;
}

function toFormData(payload: TechPayload | FormData): FormData {
    if (payload instanceof FormData) return payload;

    const fd = new FormData();
    if (payload.part_of_department != null) fd.append("part_of_department", String(payload.part_of_department));
    if (payload.equipment_room != null && payload.equipment_room !== "")
        fd.append("equipment_room", String(payload.equipment_room));
    if (payload.count_pc_jcats != null && payload.count_pc_jcats !== "")
        fd.append("count_pc_jcats", String(payload.count_pc_jcats));
    if (payload.configuration) fd.append("configuration", payload.configuration);
    if (payload.invitation_solve_problems) fd.append("invitation_solve_problems", payload.invitation_solve_problems);
    if (payload.count_person != null && payload.count_person !== "")
        fd.append("count_person", String(payload.count_person));

    if (Array.isArray(payload.photos)) {
        payload.photos.forEach((file, i) => {
            fd.append(`photo_reports[${i}][report_thumbnail]`, file);
        });
    }
    return fd;
}

async function create(payload: TechPayload | FormData) {
    const body = toFormData(payload);
    const { data } = await axiosInstance.post(ENDPOINTS.create, body, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
}

async function update(id: number, payload: TechPayload | FormData) {
    const body = toFormData(payload);
    const { data } = await axiosInstance.put(ENDPOINTS.update(id), body, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
}

async function remove(id: number) {
    const { data } = await axiosInstance.delete(ENDPOINTS.delete(id));
    return data;
}

const techBaseService = {
    getUnits,
    listByUnit,
    listMine,
    getPartOfDepartments,
    create,
    update,
    remove,
};

export default techBaseService;
