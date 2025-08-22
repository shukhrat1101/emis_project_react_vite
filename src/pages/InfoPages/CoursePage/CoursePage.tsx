import React, { useEffect, useState } from "react";
import { IoMdAddCircle } from "react-icons/io";
import { FaEdit, FaEye } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import courseService, { Course, CoursePayload } from "../../../services/courseService";
import CourceModal from "../../../components/Modals/Course/CourceModal";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import Pagination from "../../../components/UI/Pagination";
import Loader from "../../../components/UI/Loader";

import "./CoursePage.scss";
import "../../../style/global.scss";

const TOAST = {
  LOAD_ERR: "course-load-error",
  CREATE_OK: "course-create-ok",
  UPDATE_OK: "course-update-ok",
  DELETE_OK: "course-delete-ok",
  ACTION_ERR: "course-action-error",
};

const CoursePage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<Course | undefined>(undefined);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await courseService.list(page, pageSize);
      setCourses(res?.results || []);
      setTotal(res?.total || 0);
    } catch (e) {
      console.error("Kurslarni yuklashda xatolik:", e);
      toast.error("Kurslarni yuklashda xatolik!", { toastId: TOAST.LOAD_ERR });
      setCourses([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [page, pageSize]);

  const handleAdd = () => {
    setEditData(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (row: Course) => {
    setEditData(row);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await courseService.delete(deleteId);
      toast.success("Ma'lumot o‘chirildi!", { toastId: TOAST.DELETE_OK });
      setIsDeleteModalOpen(false);
      setDeleteId(null);

      const newTotal = Math.max(0, total - 1);
      const maxPage = Math.max(1, Math.ceil(newTotal / pageSize));
      if (page > maxPage) setPage(maxPage);
      else fetchCourses();
    } catch (e) {
      console.error("O‘chirishda xatolik:", e);
      toast.error("O‘chirishda xatolik yuz berdi!", { toastId: TOAST.ACTION_ERR });
    }
  };

  const handleFormSubmit = async (payload: CoursePayload) => {
    try {
      if (editData?.id) {
        await courseService.update(editData.id, payload);
        toast.success("Ma'lumot yangilandi!", { toastId: TOAST.UPDATE_OK });
      } else {
        await courseService.create(payload);
        toast.success("Ma'lumot saqlandi!", { toastId: TOAST.CREATE_OK });
      }
      fetchCourses();
    } catch (e) {
      console.error("Saqlashda xatolik:", e);
      toast.error("Saqlashda xatolik yuz berdi!", { toastId: TOAST.ACTION_ERR });
    } finally {
      setIsModalOpen(false);
    }
  };

  const handleViewStudents = (id: number) => {
    navigate(`/malumotnoma/kurs/${id}/oquvchilar`);
  };

  return (
    <div className="course-page">
      <div className="header">
        <h2 className="title">Kurslar ro‘yxati</h2>
        <button className="add-btn" onClick={handleAdd}>
          <IoMdAddCircle /> Qo‘shish
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>T/R</th>
                <th>Kurs nomi</th>
                <th>O‘tkazish joyi</th>
                <th>Sana</th>
                <th>O‘quv yili</th>
                <th>Tinglovchilar soni</th>
                <th>Tinglovchilar</th>
                <th className="amal">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(courses) && courses.length > 0 ? (
                courses.map((row, index) => (
                  <tr key={row.id}>
                    <td>{(page - 1) * pageSize + index + 1}</td>
                    <td>{row.course_name}</td>
                    <td>{row.course_place}</td>
                    <td>{row.start_date} / {row.end_date}</td>
                    <td>{row.course_year}</td>
                    <td>{row.student_count}</td>

                    <td>
                      <button
                        className="btn detail"
                        onClick={() => handleViewStudents(row.id)}
                        title="Kurs o‘quvchilari"
                      >
                        <FaEye /> Tinglovchilarni ko`rish
                      </button>
                    </td>

                    <td className="actions">
                      <div className="actions-inner">
                        <button
                          className="btn edit"
                          onClick={() => handleEdit(row)}
                          title="Tahrirlash"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn delete"
                          onClick={() => {
                            setDeleteId(row.id);
                            setIsDeleteModalOpen(true);
                          }}
                          title="O‘chirish"
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
                    Maʼlumot topilmadi
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

      <CourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editData}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        text="Kursni o‘chirmoqchimisiz?"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default CoursePage;
