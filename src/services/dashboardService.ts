import axiosInstance from "./axiosInstance";

export type TeachingType = "o'quv" | "tadqiqot";
export type Degree = "strategik" | "operativ" | "taktik";
export type BranchTypeCode = "mv" | "kt" | "xd";

export interface DegreeStat {
    degree: Degree;
    count: number;
}
export interface BranchTypeStat {
    branch_type: BranchTypeCode;
    count: number;
}
export interface TeachingStatistics {
    teaching_year: string;
    teaching_type: TeachingType;
    degree_stats: DegreeStat[];
    branch_type_stats: BranchTypeStat[];
}

export interface TeachingListItem {
    id: number;
    teaching_type: string;
    degree: string;
    lesson: string;
    leader: string;
    teaching_place: string;
    start_date: string;
    end_date: string;
    plan: string;
    teaching_year: string;
    created_by: string;
}

export interface DashboardCounts {
    total_biografic_data: number;
    total_vacants: number;
    total_courses_count: number;
    total_competitions_count: number;
    total_count_pc_jcats: number;
    total_commands: number;
}

export interface CourseDepartment {
    department_id: number;
    department_name: string;
    serviceman_count: number;
}

export interface CompetitionDepartment {
    id: number;
    name: string;
    participant_count: number;
}

export interface DistrictShtat {
    id: number;
    name: string;
    count_person_total: number;
    biografic_data_count: number;
    vacants: number;
}

export const DEGREE_LABEL: Record<Degree, string> = {
    strategik: "Strategik",
    operativ: "Operativ",
    taktik: "Taktik",
};
export const BRANCH_LABEL: Record<BranchTypeCode, string> = {
    mv: "Mudofaa vazirligi",
    kt: "Kuch tuzilmalar",
    xd: "Xorijiy davlatlar",
};
export const DEGREE_ORDER: Degree[] = ["strategik", "operativ", "taktik"];

export function degreeLabelToKey(label: string): Degree {
    const l = label.trim().toLowerCase();
    if (l.startsWith("stra")) return "strategik";
    if (l.startsWith("oper")) return "operativ";
    return "taktik";
}

export async function fetchTeachingStatistics(
    teaching_type: TeachingType,
    teaching_year: number | string,
    signal?: AbortSignal
): Promise<TeachingStatistics> {
    const { data } = await axiosInstance.get<TeachingStatistics>(
        "/dashboard/teaching-statistics/",
        { params: { teaching_type, teaching_year }, signal }
    );
    return data;
}

export async function fetchTeachingStatsBoth(
    teaching_year: number | string,
    signal?: AbortSignal
): Promise<{ oq: TeachingStatistics; tad: TeachingStatistics }> {
    const [oq, tad] = await Promise.all([
        fetchTeachingStatistics("o'quv", teaching_year, signal),
        fetchTeachingStatistics("tadqiqot", teaching_year, signal),
    ]);
    return { oq, tad };
}

export async function fetchTeachingList(params: {
    teaching_type: TeachingType;
    teaching_year: number | string;
    degree: Degree;
    signal?: AbortSignal;
}): Promise<TeachingListItem[]> {
    const { data } = await axiosInstance.get<TeachingListItem[]>(
        "/dashboard/teaching-list/",
        {
            params: {
                teaching_type: params.teaching_type,
                teaching_year: params.teaching_year,
                degree: params.degree,
            },
            signal: params.signal,
        }
    );
    return data ?? [];
}


export function toPieDataFromDegreeOrdered(stats: DegreeStat[]) {
    const by = new Map(stats.map((s) => [s.degree, s.count]));
    return DEGREE_ORDER.map((d) => ({
        name: DEGREE_LABEL[d],
        value: by.get(d) ?? 0,
    }));
}


export async function fetchDashboardCounts(signal?: AbortSignal): Promise<DashboardCounts> {
    const { data } = await axiosInstance.get<DashboardCounts>(
        "/dashboard/statistics/counts/",
        { signal }
    );
    return data;
}

export async function fetchCoursesByDepartment(signal?: AbortSignal): Promise<CourseDepartment[]> {
    const { data } = await axiosInstance.get<CourseDepartment[]>("/dashboard/courses/", { signal });
    return data ?? [];
}


export async function fetchCompetitionsByDepartment(signal?: AbortSignal): Promise<CompetitionDepartment[]> {
    const { data } = await axiosInstance.get<CompetitionDepartment[]>("/dashboard/competitions/", { signal });
    return data ?? [];
}

export async function fetchDistrictShtats(signal?: AbortSignal): Promise<DistrictShtat[]> {
    const { data } = await axiosInstance.get<DistrictShtat[]>("/dashboard/district/shtats/", { signal });
    return data ?? [];
}


export const sumDegree = (arr: DegreeStat[]) =>
    arr.reduce((a, b) => a + (b?.count ?? 0), 0);
export const sumBranch = (arr: BranchTypeStat[]) =>
    arr.reduce((a, b) => a + (b?.count ?? 0), 0);
