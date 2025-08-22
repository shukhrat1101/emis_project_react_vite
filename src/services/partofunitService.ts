import axiosInstance from "./axiosInstance";

export interface PositionItem {
    id: number;
    name: string;
}

export interface ContingentTable {
    id: number;
    type: string;
    count_person: number;
    position?: PositionItem[];
}

export interface ShtatDetail {
    contingent_tables: ContingentTable[];
}


export interface PartUnitIn {
    id: number;
    name: string;
    department: string;
    type: string;
    shtat: number | ShtatDetail | null;
}

export type UnitItem = Omit<PartUnitIn, "shtat"> & {
    shtat: ShtatDetail | null;
};

export interface PartUnitCreateUpdate {
    name: string;
    type: string;
    shtat: number;
}

export interface PartUnitsResponse {
    total: number;
    page: number;
    page_size: number;
    results: PartUnitIn[];
}

export interface PartUnitSelectItem {
    id: number;
    name: string;
    department: string;
}

export interface PartUnitSelectResponse {
    total: number;
    page: number;
    page_size: number;
    results: PartUnitSelectItem[];
}

const partOfUnitService = {
    getUnitsByDepartmentId: async (
        departmentId: number | string,
        params?: { page?: number; page_size?: number }
    ): Promise<PartUnitsResponse> => {
        const { page, page_size } = params ?? {};
        const { data } = await axiosInstance.get<PartUnitsResponse>(
            `/catalog/part-of-department/department/${departmentId}/units/`,
            { params: { page, page_size } }
        );
        return data;
    },

    create: async (
        departmentId: number | string,
        payload: PartUnitCreateUpdate
    ): Promise<PartUnitIn> => {
        const { data } = await axiosInstance.post<PartUnitIn>(
            `/catalog/part-of-department/department/${departmentId}/create/`,
            payload
        );
        return data;
    },

    update: async (
        departmentId: number | string,
        unitId: number | string,
        payload: PartUnitCreateUpdate
    ): Promise<PartUnitIn> => {
        const { data } = await axiosInstance.put<PartUnitIn>(
            `/catalog/part-of-department/department/${departmentId}/update/${unitId}/`,
            payload
        );
        return data;
    },

    delete: async (
        departmentId: number | string,
        unitId: number | string
    ): Promise<void> => {
        await axiosInstance.delete(
            `/catalog/part-of-department/department/${departmentId}/delete/${unitId}/`
        );
    },

    select: async (
        params?: { page?: number; page_size?: number; search?: string; department?: number | string }
    ): Promise<PartUnitSelectResponse> => {
        const { data } = await axiosInstance.get<PartUnitSelectResponse>(
            `/catalog/part-of-department/select/`,
            { params }
        );
        return data;
    },
};

export default partOfUnitService;
