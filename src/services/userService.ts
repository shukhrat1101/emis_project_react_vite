// src/services/userService.ts
import axiosInstance from "./axiosInstance";

export type User = {
    id: number;
    username: string;
    department: string | null;
    role: "superadmin" | "admin" | "user" | string;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    can_crud: boolean;
    created_at?: string;
    updated_at?: string;
};

export type UserListResponse = {
    total: number;
    page: number;
    page_size: number;
    results: User[];
};

export type UserProfile = {
    user: number;
    id: number;
    full_name: string | null;
    rank: string | null;
    position: string | null;
    department: string | null;
    image: string | null;
    phone_number: string | null;
    passport_id: string | null;
    updated_at: string | null;
};

export type CurrentUser = {
    can_crud: boolean;
    id: number;
    username: string;
    role: "superadmin" | "admin" | "user" | string;
    rank: string | null;
    position: string | null;
    department: string | null;
    full_name: string | null;
    phone_number: string | null;
    passport_id: string | null;
    image: string | null;
};

export type ProfileUpdatePayload = {
    rank?: number;
    position?: number;
    full_name?: string;
    phone_number?: string;
    passport_id?: string;
    image?: File | null;
};

type ListParams = {
    page?: number;
    page_size?: number;
    search?: string;
};

async function list(params?: ListParams, signal?: AbortSignal): Promise<UserListResponse> {
    const { data } = await axiosInstance.get<UserListResponse>("/user/list/", { params, signal });
    return data;
}

async function create(
    payload: {
        username: string;
        role: string;
        department: number;
        password: string;
        confirm_password: string;
        can_crud?: boolean;
    },
    signal?: AbortSignal
): Promise<User> {
    const { data } = await axiosInstance.post<User>("/user/create/", payload, { signal });
    return data;
}

async function update(id: number | string, payload: any, signal?: AbortSignal): Promise<User> {
    const { data } = await axiosInstance.patch<User>(`/user/update/${id}/`, payload, { signal });
    return data;
}

async function remove(id: number | string, signal?: AbortSignal): Promise<void> {
    await axiosInstance.delete(`/user/delete/${id}/`, { signal });
}

async function getProfile(userId: number | string, signal?: AbortSignal): Promise<UserProfile> {
    const { data } = await axiosInstance.get<UserProfile>(`/user/${userId}/profile/`, { signal });
    return data;
}

export async function me(signal?: AbortSignal) {
    const { data } = await axiosInstance.get("/user/me/", {
        signal,
        __skipAuthRedirect: true,
    } as any);
    return data;
}

async function updateProfile(
    userId: number | string,
    payload: ProfileUpdatePayload,
    signal?: AbortSignal
): Promise<UserProfile> {
    const fd = new FormData();
    if (payload.rank !== undefined) fd.append("rank", String(payload.rank));
    if (payload.position !== undefined) fd.append("position", String(payload.position));
    if (payload.full_name !== undefined) fd.append("full_name", payload.full_name);
    if (payload.phone_number !== undefined) fd.append("phone_number", payload.phone_number);
    if (payload.passport_id !== undefined) fd.append("passport_id", payload.passport_id);
    if (payload.image instanceof File) fd.append("image", payload.image);

    const { data } = await axiosInstance.patch<UserProfile>(
        `/user/${userId}/profile/update/`,
        fd,
        {
            headers: { "Content-Type": "multipart/form-data" },
            transformRequest: [(d) => d],
            signal,
        }
    );
    return data;
}

const userService = { list, create, update, remove, getProfile, me, updateProfile };
export default userService;
