import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoMdAddCircle } from "react-icons/io";
import { FaTrashCan } from "react-icons/fa6";
import { PiCertificateFill } from "react-icons/pi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Loader from "../../../components/UI/Loader";
import Pagination from "../../../components/UI/Pagination";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import CourceEnrollModal from "../../../components/Modals/Course/CourceEnrollModal";

import enrollmentService, { FlatEnrollment } from "../../../services/enrollmentService";

import "../CompetitionPage/CompetitionParticipant.scss";
import "../../../style/global.scss";

const TOAST = {
  LOAD_ERR: "enroll-load-error",
  DELETE_OK: "enroll-delete-ok",
  ACTION_ERR: "enroll-action-error",
};

const CourceEnrollPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [courseTitle, setCourseTitle] = useState<string>("");
  const [all, setAll] = useState<FlatEnrollment[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);

  const [capacity, setCapacity] = useState<number | null>(null);
  const [enrolledCount, setEnrolledCount] = useState<number>(0);

  const total = all.length;
  const isFull = capacity !== null && enrolledCount >= capacity;

  const items = useMemo(() => {
    const start = (page - 1) * pageSize;
    return all.slice(start, start + pageSize);
  }, [all, page, pageSize]);

  const fetchEnrollments = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await enrollmentService.listByCourse(Number(id), { page: 1, page_size: 10 });

      const first: any = res?.results?.[0];
      setCourseTitle(first?.course_name || `#${id}`);

      const cap = typeof first?.student_count === "number" ? first.student_count : null;
      setCapacity(cap);
      const current = Array.isArray(first?.enrollments) ? first.enrollments.length : 0;
      setEnrolledCount(current);

      const flat = enrollmentService.toFlat(res);
      setAll(flat);
    } catch (e) {
      console.error("Tinglovchilarni yuklashda xatolik:", e);
      toast.error("Tinglovchilarni yuklashda xatolik!", { toastId: TOAST.LOAD_ERR });
      setAll([]);
      setCourseTitle(`№ ${id}`);
      setCapacity(null);
      setEnrolledCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    try {
      await enrollmentService.remove(deleteId);
      toast.success("Tinglovchi o‘chirildi!", { toastId: TOAST.DELETE_OK });
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      setAll((prev) => prev.filter((x) => x.enrollment_id !== deleteId));

      const newTotal = total - 1;
      const maxPage = Math.max(1, Math.ceil(newTotal / pageSize));
      if (page > maxPage) setPage(maxPage);

      setEnrolledCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error("O‘chirishda xatolik:", e);
      toast.error("O‘chirishda xatolik yuz berdi!", { toastId: TOAST.ACTION_ERR });
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [id]);

  const goCertificate = (enrollmentId: number, fullName: string) => {
    navigate(`/malumotnoma/kurs/enrollment/${enrollmentId}/certificate`, {
      state: { servicemanName: fullName },
    });
  };

  return (
    <div className="compet-part-page">
      <div className="header">
        <h2 className="title">“{courseTitle || `#${id}`}” tinglovchilari</h2>

        {!isFull && (
          <button className="add-btn" onClick={() => setIsAddOpen(true)}>
            <IoMdAddCircle /> Qo‘shish
          </button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>T/R</th>
                <th>F.I.Sh</th>
                <th>Unvon</th>
                <th>Lavozim</th>
                <th>Harbiy qism</th>
                <th>JSHSHIR</th>
                <th className="participants-cell">Sertifikat</th>
                <th className="amal">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((row, idx) => (
                  <tr key={row.enrollment_id}>
                    <td>{(page - 1) * pageSize + idx + 1}</td>
                    <td>{row.serviceman.full_name}</td>
                    <td>{row.serviceman.rank}</td>
                    <td>{row.serviceman.position}</td>
                    <td>{row.serviceman.military_unit}</td>
                    <td>{row.serviceman.pinfl}</td>
                    <td className="participants-cell">
                      <button
                        className="btn detail"
                        title="Sertifikatni ko‘rish"
                        onClick={() => goCertificate(row.enrollment_id, row.serviceman.full_name)}
                      >
                        <PiCertificateFill size={18}/>
                      </button>
                    </td>
                    <td className="actions">
                      <div className="actions-inner">
                        <button
                          className="btn delete"
                          title="O‘chirish"
                          onClick={() => {
                            setDeleteId(row.enrollment_id);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <FaTrashCan />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center" }}>
                    Tinglovchilar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <Pagination
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        </div>
      )}

      <CourceEnrollModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        courseId={Number(id)}
        onSaved={async () => {
          await fetchEnrollments();
        }}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        text="Ushbu tinglovchini o‘chirmoqchimisiz?"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default CourceEnrollPage;
