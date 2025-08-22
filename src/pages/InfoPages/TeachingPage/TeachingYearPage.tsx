import React, {useEffect, useState} from "react";
import {IoMdAddCircle} from "react-icons/io";
import {FaEdit} from "react-icons/fa";
import {FaTrashCan} from "react-icons/fa6";
import {toast} from "react-toastify";
import teachYearService from "../../../services/teachYearService";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import Pagination from "../../../components/UI/Pagination";
import Loader from "../../../components/UI/Loader";
import "react-toastify/dist/ReactToastify.css";
import "./TeachingPage.scss"
import "../../../style/global.scss";
import TeachYearModal from "../../../components/Modals/Teaching/TeachingYearModal";

interface TeachingYear {
    id: number;
    start_year: number;
    end_year: number;
}

const TeachingYearPage: React.FC = () => {
    const [allYears, setAllYears] = useState<TeachingYear[]>([]);
    const [years, setYears] = useState<TeachingYear[]>([]);
    const [total, setTotal] = useState(0);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [loading, setLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState<TeachingYear | undefined>(undefined);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const recalcVisible = (list: TeachingYear[], p = page, ps = pageSize) => {
        const start = (p - 1) * ps;
        setYears(list.slice(start, start + ps));
    };
    const LOAD_ERROR_TOAST_ID = "teachYear-load-error";

    const fetchYears = async () => {
        try {
            setLoading(true);
            const list = await teachYearService.getAll();
            setAllYears(list);
            setTotal(list.length);
            recalcVisible(list, page, pageSize);
        } catch (error) {
            console.error("O‘quv yillarini yuklashda xatolik:", error);
            toast.error("O‘quv yillarini yuklashda xatolik!", {
                toastId: LOAD_ERROR_TOAST_ID,
            });

            setAllYears([]);
            setYears([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchYears();
    }, []);

    useEffect(() => {
        recalcVisible(allYears, page, pageSize);
    }, [page, pageSize, allYears]);

    const handleAdd = () => {
        setEditData(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (item: TeachingYear) => {
        setEditData(item);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (deleteId === null) return;
        try {
            await teachYearService.remove(deleteId);
            toast.success("Ma'lumot o‘chirildi!");
            setIsDeleteModalOpen(false);
            setDeleteId(null);
            await fetchYears();
            const maxPage = Math.max(1, Math.ceil((total - 1) / pageSize));
            if (page > maxPage) setPage(maxPage);
        } catch (error) {
            console.error("O‘chirishda xatolik:", error);
            toast.error("O‘chirishda xatolik yuz berdi!");
        }
    };

    const handleFormSubmit = async (formData: FormData) => {
        try {
            const start = Number(formData.get("start_year"));
            const end = Number(formData.get("end_year"));

            if (!Number.isInteger(start) || !Number.isInteger(end)) {
                toast.error("Yillar butun son bo‘lishi kerak.");
                return;
            }
            if (start >= end) {
                toast.error("Boshlanish yili tugash yilidan kichik bo‘lishi kerak.");
                return;
            }

            if (editData?.id) {
                await teachYearService.update(editData.id, {start_year: start, end_year: end});
                toast.success("Ma'lumot yangilandi!");
            } else {
                await teachYearService.create({start_year: start, end_year: end});
                toast.success("Ma'lumot saqlandi!");
            }
            await fetchYears();
        } catch (error) {
            console.error("Saqlashda xatolik:", error);
            toast.error("Saqlashda xatolik yuz berdi!");
        } finally {
            setIsModalOpen(false);
        }
    };

    return (
        <div className="teach-year-page">
            <div className="header">
                <h2 className="title">O‘quv yillari ro‘yxati</h2>
                <button className="add-btn" onClick={handleAdd}>
                    <IoMdAddCircle/> Qo‘shish
                </button>
            </div>

            {loading ? (
                <Loader/>
            ) : (
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                        <tr>
                            <th>T/R</th>
                            <th>Boshlanish yili</th>
                            <th>Tugash yili</th>
                            <th className="amal">Amallar</th>
                        </tr>
                        </thead>
                        <tbody>
                        {Array.isArray(years) && years.length > 0 ? (
                            years.map((item, index) => (
                                <tr key={item.id}>
                                    <td>{(page - 1) * pageSize + index + 1}</td>
                                    <td>{item.start_year}</td>
                                    <td>{item.end_year}</td>
                                    <td className="actions">
                                        <div className="actions-inner">
                                            <button className="btn edit" onClick={() => handleEdit(item)}>
                                                <FaEdit/>
                                            </button>
                                            <button
                                                className="btn delete"
                                                onClick={() => {
                                                    setDeleteId(item.id);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                            >
                                                <FaTrashCan/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} style={{textAlign: "center"}}>
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

            <TeachYearModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editData}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                text="O‘quv yilini o‘chirmoqchimisiz?"
                onCancel={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
            />
        </div>
    );
};

export default TeachingYearPage;
