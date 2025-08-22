import axiosInstance from "./axiosInstance";

export interface MilitaryServiceman {
  id: number;
  rank: string;
  full_name: string;
  position: string;
  military_unit: string;
  pinfl: string;
}

export interface EnrollmentItem {
  id: number;
  military_serviceman: MilitaryServiceman;
}

export interface EnrollmentBlock {
  id: number;
  course_name: string;
  student_count?: number | null;
  enrollments: EnrollmentItem[];
}

export interface EnrollmentListResponse {
  total: number;
  page: number;
  page_size: number;
  results: EnrollmentBlock[];
}

export type EnrollmentQuery = {
  page?: number;
  page_size?: number;
};

export interface EnrollmentCreatePayload {
  course: number;
  military_serviceman: number;
}

export interface FlatEnrollment {
  enrollment_id: number;
  course_id: number;
  course_name: string;
  serviceman: MilitaryServiceman;
}

const BASE = "/course/enrollment";

async function listByCourse(
  courseId: number | string,
  params: EnrollmentQuery = {}
): Promise<EnrollmentListResponse> {
  const { data } = await axiosInstance.get<EnrollmentListResponse>(
    `${BASE}/${courseId}/list/`,
    { params }
  );
  return data;
}

async function create(payload: EnrollmentCreatePayload): Promise<EnrollmentItem> {
  const { data } = await axiosInstance.post<EnrollmentItem>(
    `${BASE}/create/`,
    payload,
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
}

async function remove(enrollmentId: number | string): Promise<void> {
  await axiosInstance.delete(`${BASE}/delete/${enrollmentId}/`);
}

function toFlat(list: EnrollmentListResponse): FlatEnrollment[] {
  return (list.results || []).flatMap((block) =>
    (block.enrollments || []).map((e) => ({
      enrollment_id: e.id,
      course_id: block.id,
      course_name: block.course_name,
      serviceman: e.military_serviceman,
    }))
  );
}

function getCapacity(resp: EnrollmentListResponse): number | null {
  const first = resp?.results?.[0];
  return typeof first?.student_count === "number" ? first.student_count : null;
}

function getEnrolledCount(resp: EnrollmentListResponse): number {
  return (resp.results || []).reduce((sum, b) => sum + (b.enrollments?.length || 0), 0);
}

function isFull(resp: EnrollmentListResponse): boolean {
  const cap = getCapacity(resp);
  if (cap == null) return false;
  return getEnrolledCount(resp) >= cap;
}

const enrollmentService = {
  listByCourse,
  create,
  remove,
  toFlat,
  getCapacity,
  getEnrolledCount,
  isFull,
};

export default enrollmentService;
