import axiosInstance from "./axiosInstance";

export type CreatedBy = { id: number; username: string };

export type Award = {
    id: number;
    biografic_data: number;
    awarded_by: string;
    command_number: string;
    awarded_date: string;
    award_name: string;
    created_by: CreatedBy;
};

export type Punishment = {
    id: number;
    biografic_data: number;
    who_punished: string;
    punishment_name: string;
    punishment_date: string;
    finished_date: string | null;
    is_finished: boolean;
    created_by: CreatedBy;
};

const ENDPOINTS = {
    award: {
        list: (bioId: number) => `/shtat_account/bio-award/${bioId}/list/`,
        create: `/shtat_account/bio-award/create/`,
        update: (id: number) => `/shtat_account/bio-award/update/${id}/`,
        delete: (id: number) => `/shtat_account/bio-award/delete/${id}/`,
    },
    punishment: {
        list: (bioId: number) => `/shtat_account/bio-punishment/${bioId}/list/`,
        create: `/shtat_account/bio-punishment/create/`,
        update: (id: number) => `/shtat_account/bio-punishment/update/${id}/`,
        delete: (id: number) => `/shtat_account/bio-punishment/delete/${id}/`,
    },
};

async function listAwards(bioId: number): Promise<Award[]> {
    const { data } = await axiosInstance.get<Award[]>(ENDPOINTS.award.list(bioId));
    return Array.isArray(data) ? data : [];
}

async function createAward(payload: Omit<Award, "id" | "created_by">): Promise<Award> {
    const { data } = await axiosInstance.post<Award>(ENDPOINTS.award.create, payload);
    return data;
}

async function updateAward(id: number, payload: Omit<Award, "id" | "created_by">): Promise<Award> {
    try {
        const { data } = await axiosInstance.put<Award>(ENDPOINTS.award.update(id), payload);
        return data;
    } catch (err: any) {
        if (err?.response?.status === 405) {
            const { data } = await axiosInstance.patch<Award>(ENDPOINTS.award.update(id), payload);
            return data;
        }
        throw err;
    }
}

async function deleteAward(id: number): Promise<void> {
    await axiosInstance.delete(ENDPOINTS.award.delete(id));
}

async function listPunishments(bioId: number): Promise<Punishment[]> {
    const { data } = await axiosInstance.get<Punishment[]>(ENDPOINTS.punishment.list(bioId));
    return Array.isArray(data) ? data : [];
}

async function createPunishment(
    payload: Omit<Punishment, "id" | "created_by">
): Promise<Punishment> {
    const { data } = await axiosInstance.post<Punishment>(ENDPOINTS.punishment.create, payload);
    return data;
}

async function updatePunishment(
    id: number,
    payload: Omit<Punishment, "id" | "created_by">
): Promise<Punishment> {
    try {
        const { data } = await axiosInstance.put<Punishment>(ENDPOINTS.punishment.update(id), payload);
        return data;
    } catch (err: any) {
        if (err?.response?.status === 405) {
            const { data } = await axiosInstance.patch<Punishment>(ENDPOINTS.punishment.update(id), payload);
            return data;
        }
        throw err;
    }
}

async function deletePunishment(id: number): Promise<void> {
    await axiosInstance.delete(ENDPOINTS.punishment.delete(id));
}

const stateService = {
    listAwards,
    createAward,
    updateAward,
    deleteAward,
    listPunishments,
    createPunishment,
    updatePunishment,
    deletePunishment,
};

export default stateService;
