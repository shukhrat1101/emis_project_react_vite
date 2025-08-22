import React, { useEffect, useMemo, useState } from "react";
import { IoMdAddCircle } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Pagination from "../../../components/UI/Pagination";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import Loader from "../../../components/UI/Loader";
import CategoryNewsModal from "../../../components/Modals/News/CategoryNewsModal";

import categoryNewsService from "../../../services/categoryNewsService";

import "./CategoryNewsPage.scss";
import "../../../style/global.scss";
import { GrLinkNext } from "react-icons/gr";

type Category = {
    id: number;
    name: string;
};

const TOAST = {
    LOAD_ERR: "cat-load-error",
    CREATE_OK: "cat-create-ok",
    UPDATE_OK: "cat-update-ok",
    DELETE_OK: "cat-delete-ok",
    ACTION_ERR: "cat-action-err",
};

const NEWS_FIRST_PAGE = 1;
const NEWS_PAGE_SIZE = 10;

const CategoryNewsPage: React.FC = () => {
    const navigate = useNavigate();

    const [items, setItems] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);

    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState<Category | undefined>(undefined);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await categoryNewsService.list();
            setItems(data || []);
            setTotal((data || []).length);
        } catch (e) {
            setItems([]);
            setTotal(0);
            toast.error("Ma`lumotni yuklashda xatolik", { toastId: TOAST.LOAD_ERR });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const pageSlice = useMemo(() => {
        const start = (page - 1) * pageSize;
        return items.slice(start, start + pageSize);
    }, [items, page, pageSize]);

    const handleAdd = () => {
        setEditData(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (row: Category) => {
        setEditData(row);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (deleteId == null) return;
        try {
            await categoryNewsService.remove(deleteId);
            toast.success("Ma`lumot o‘chirildi!", { toastId: TOAST.DELETE_OK });
            await fetchData();
            const maxPage = Math.max(1, Math.ceil((items.length - 1) / pageSize));
            if (page > maxPage) setPage(maxPage);
        } catch {
            toast.error("Ma`lumotni o‘chirishda xatolik", { toastId: TOAST.ACTION_ERR });
        } finally {
            setIsDeleteModalOpen(false);
            setDeleteId(null);
        }
    };

    const handleFormSubmit = async (fd: FormData, id?: number) => {
        try {
            const name = (fd.get("name") || "").toString().trim();
            if (!name) {
                toast.error("Nomi bo‘sh bo‘lmasin", { toastId: TOAST.ACTION_ERR });
                return;
            }

            if (id) {
                await categoryNewsService.update(id, { name });
                toast.success("Ma`lumot yangilandi!", { toastId: TOAST.UPDATE_OK });
            } else {
                await categoryNewsService.create({ name });
                toast.success("Ma`lumot yaratildi!", { toastId: TOAST.CREATE_OK });
            }
            await fetchData();
        } catch {
            toast.error("Saqlashda xatolik yuz berdi", { toastId: TOAST.ACTION_ERR });
        } finally {
            setIsModalOpen(false);
        }
    };

    const openNewsForCategory = (row: Category) => {
        const search = new URLSearchParams({
            page: String(NEWS_FIRST_PAGE),
            page_size: String(NEWS_PAGE_SIZE),
        }).toString();
        navigate(`/malumotnoma/yangiliklar/${row.id}?${search}`);
    };

    return (
        <div className="category-news-page">
            <div className="header">
                <h2 className="title">Kategoriyalar ro‘yxati</h2>
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
                            <th>Kategoriya nomi</th>
                            <th>Kategoriya yangiliklari</th>
                            <th className="amal">Amallar</th>
                        </tr>
                        </thead>
                        <tbody>
                        {pageSlice.length ? (
                            pageSlice.map((row, idx) => (
                                <tr key={row.id ?? idx}>
                                    <td>{(page - 1) * pageSize + idx + 1}</td>
                                    <td>{row.name}</td>
                                    <td>
                                        <button className="btn detail" onClick={() => openNewsForCategory(row)}>
                                            Yangiliklarga o`tish
                                            <GrLinkNext style={{ marginRight: 6 }} size={18} />
                                        </button>
                                    </td>
                                    <td className="actions">
                                        <div className="actions-inner">
                                            <button className="btn edit" onClick={() => handleEdit(row)}>
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="btn delete"
                                                onClick={() => {
                                                    setDeleteId(row.id);
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
                                <td colSpan={4} style={{ textAlign: "center" }}>
                                    Ma'lumot topilmadi
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
                        onPageSizeChange={(s) => {
                            setPageSize(s);
                            setPage(1);
                        }}
                    />
                </div>
            )}

            <CategoryNewsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editData}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                text="Ma`lumotni o‘chirmoqchimisiz?"
                onCancel={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
            />
        </div>
    );
};

export default CategoryNewsPage;
