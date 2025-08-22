import React, {useEffect, useState} from "react";
import {IoMdAddCircle} from "react-icons/io";
import {FaEdit, FaEye} from "react-icons/fa";
import {FaTrashCan} from "react-icons/fa6";
import {toast} from "react-toastify";
import {useNavigate} from "react-router-dom";
import teachResearchService, { TeachingResearch } from "../../../services/teachResearchService";
import TeachResearchModal, { TeachingResearchInitial } from "../../../components/Modals/Teaching/TeachResearchModal";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import Pagination from "../../../components/UI/Pagination";
import Loader from "../../../components/UI/Loader";
import "react-toastify/dist/ReactToastify.css";
import "./TeachingPage.scss";
import "../../../style/global.scss";

const MAX_LESSON_CHARS = 40;

const TOAST = {
    LOAD_ERR: "teachresearch-load-error",
    CREATE_OK: "teachresearch-create-ok",
    UPDATE_OK: "teachresearch-update-ok",
    DELETE_OK: "teachresearch-delete-ok",
    ACTION_ERR: "teachresearch-action-error",
};

function extractApiErrors(err: any): string[] {
    const msgs: string[] = [];
    const data = err?.response?.data;

    const collect = (v: any) => {
        if (v === null || v === undefined) return;
        if (typeof v === "string") {
            msgs.push(v);
        } else if (Array.isArray(v)) {
            v.forEach(collect);
        } else if (typeof v === "object") {
            Object.values(v).forEach(collect);
        }
    };

    if (data) collect(data);
    if (!msgs.length) msgs.push("Xatolik yuz berdi.");
    return msgs;
}

const TeachResearchPage: React.FC = () => {
    const [items, setItems] = useState<TeachingResearch[]>([]);
    const [total, setTotal] = useState(0);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [loading, setLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState<TeachingResearchInitial | undefined>(undefined);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const [expandedLessonId, setExpandedLessonId] = useState<number | null>(null);

    const navigate = useNavigate();

    const fetchList = async () => {
        try {
            setLoading(true);
            const res = await teachResearchService.getAll(page, pageSize);
            setItems(res.results || []);
            setTotal(res.total || 0);
        } catch (error: any) {
            console.error("Ro‘yxatni yuklashda xatolik:", error);
            setItems([]);
            setTotal(0);
            extractApiErrors(error).forEach((m, i) =>
                toast.error(m, { toastId: `${TOAST.LOAD_ERR}-${i}-${m}` })
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, [page, pageSize]);

    const handleAdd = () => {
        setEditData(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (row: TeachingResearch) => {
        const initial: TeachingResearchInitial = {
            id: row.id,
            teaching_type: row.teaching_type,
            degree: row.degree,
            lesson: row.lesson,
            leader: row.leader,
            teaching_place: row.teaching_place,
            start_date: row.start_date,
            end_date: row.end_date,
            plan: row.plan,
            teaching_year: row.teaching_year,
        };
        setEditData(initial);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (deleteId === null) return;
        try {
            await teachResearchService.remove(deleteId);
            toast.success("Ma'lumot o‘chirildi!", { toastId: TOAST.DELETE_OK });
            setIsDeleteModalOpen(false);
            setDeleteId(null);

            const newTotal = total - 1;
            const maxPage = Math.max(1, Math.ceil(newTotal / pageSize));
            if (page > maxPage) setPage(maxPage);
            else fetchList();
        } catch (error: any) {
            console.error("O‘chirishda xatolik:", error);
            extractApiErrors(error).forEach((m, i) =>
                toast.error(m, { toastId: `${TOAST.ACTION_ERR}-del-${i}-${m}` })
            );
        }
    };

    const handleFormSubmit = async (formData: FormData) => {
        try {
            if (editData?.id) {
                await teachResearchService.update(editData.id, formData);
                toast.success("Ma'lumot yangilandi!", { toastId: TOAST.UPDATE_OK });
            } else {
                await teachResearchService.create(formData);
                toast.success("Ma'lumot saqlandi!", { toastId: TOAST.CREATE_OK });
            }
            fetchList();
        } catch (error: any) {
            console.error("Saqlashda xatolik:", error);
            // Backenddan kelgan xatoliklarni ko‘rsatamiz (masalan, non_field_errors)
            extractApiErrors(error).forEach((m, i) =>
                toast.error(m, { toastId: `${TOAST.ACTION_ERR}-save-${i}-${m}` })
            );
        } finally {
            setIsModalOpen(false);
        }
    };

    const handleViewDivisions = (id: number) => {
        navigate(`/malumotnoma/oquv/oquv-tadqiqotlar/${id}/bolinmalar`);
    };

    const handleViewResults = (id: number) => {
        navigate(`/malumotnoma/oquv/oquv-tadqiqotlar/${id}/natija`);
    };

    const toggleLesson = (id: number) => {
        setExpandedLessonId(prev => (prev === id ? null : id));
    };

    const renderLessonCell = (row: TeachingResearch) => {
        const text = row.lesson ?? "";
        const isLong = text.length > MAX_LESSON_CHARS;
        const isExpanded = expandedLessonId === row.id;

        if (!isLong) return text;

        if (isExpanded) {
            return (
                <span>
          {text}{" "}
                    <button
                        className="link-like-btn"
                        onClick={() => toggleLesson(row.id)}
                        aria-label="Yopish"
                        title="Yopish"
                    >
            ...
          </button>
        </span>
            );
        }

        const short = text.slice(0, MAX_LESSON_CHARS);
        return (
            <span>
        {short}
                <span>… </span>
        <button
            className="link-like-btn"
            onClick={() => toggleLesson(row.id)}
            aria-label="To‘liq ko‘rish"
            title="To‘liq ko‘rish"
        >
          batafsil
        </button>
      </span>
        );
    };

    return (
        <div className="teach-year-page">
            <div className="header">
                <h2 className="title">O‘quv / Tadqiqotlar ro‘yxati</h2>
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
                            <th>O‘quv turi</th>
                            <th>Darajasi</th>
                            <th>Mavzusi</th>
                            <th>Rahbar</th>
                            <th>O‘tkazish joyi</th>
                            <th>Boshlanish va tugash sanasi</th>
                            <th>O‘quv yili</th>
                            <th>Reja</th>
                            <th>Yaratuvchi</th>
                            <th>Bo‘linma / Natija</th>
                            <th className="amal">Amallar</th>
                        </tr>
                        </thead>
                        <tbody>
                        {Array.isArray(items) && items.length > 0 ? (
                            items.map((row, index) => (
                                <tr key={row.id}>
                                    <td>{(page - 1) * pageSize + index + 1}</td>
                                    <td>{row.teaching_type}</td>
                                    <td>{row.degree}</td>
                                    <td>{renderLessonCell(row)}</td>
                                    <td>{row.leader}</td>
                                    <td>{row.teaching_place}</td>
                                    <td>{row.start_date} / {row.end_date}</td>
                                    <td>{row.teaching_year}</td>
                                    <td>
                                        {row.plan ? (
                                            <a
                                                href={row.plan}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title={teachResearchService.getPlanFilename(row.plan)}
                                                download={teachResearchService.getSuggestedDownloadName(row.plan)}
                                                className="file-link"
                                            >
                                                {teachResearchService.getPlanDisplay(row.plan)}
                                            </a>
                                        ) : ("—")}
                                    </td>
                                    <td>{row.created_by}</td>

                                    <td>
                                        <button
                                            className="btn detail"
                                            onClick={() => handleViewDivisions(row.id)}
                                            title="Bo‘linmalarni ko‘rish"
                                        >
                                            <FaEye />
                                        </button>

                                        <button
                                            className="btn detail1"
                                            onClick={() => handleViewResults(row.id)}
                                            title="Natijalarni ko‘rish"
                                        >
                                            <FaEye />
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
                                <td colSpan={13} style={{ textAlign: "center" }}>
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

            <TeachResearchModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editData}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                text="Ushbu ma`lumotni o‘chirmoqchimisiz?"
                onCancel={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
            />
        </div>
    );
};

export default TeachResearchPage;
