import React, {useEffect, useMemo, useRef, useState} from "react";
import {IoMdAddCircle} from "react-icons/io";
import {FaEdit} from "react-icons/fa";
import {FaTrashCan} from "react-icons/fa6";
import {useParams} from "react-router-dom";
import {toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Pagination from "../../../components/UI/Pagination";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import Loader from "../../../components/UI/Loader";
import NewsModal from "../../../components/Modals/News/NewsModal";

import newsService, {News, NewsCreate, NewsUpdate} from "../../../services/newsService";
import categoryNewsService from "../../../services/categoryNewsService";

import "./NewsPage.scss";
import "../../../style/global.scss";

const TOAST = {
    LOAD_ERR: "news-load-error",
    CREATE_OK: "news-create-ok",
    UPDATE_OK: "news-update-ok",
    DELETE_OK: "news-delete-ok",
    ACTION_ERR: "news-action-err",
};

const formatDT = (s: string) => {
    try {
        const d = new Date(s);
        return d.toLocaleString("uz-UZ");
    } catch {
        return s;
    }
};

function fdToCreatePayload(fd: FormData): NewsCreate {
    const category = Number(fd.get("category") || 0);
    const title = String(fd.get("title") || "");
    const content = String(fd.get("content") || "");
    const journal_file = (fd.get("journal_file") as File) || null;
    const additional_images = fd.getAll("additional_images").filter(Boolean) as File[];

    const payload: NewsCreate = { category, title, content };
    if (journal_file instanceof File) payload.journal_file = journal_file;
    if (additional_images.length) payload.additional_images = additional_images;
    return payload;
}

function fdToUpdatePayload(fd: FormData): NewsUpdate {
    const payload: NewsUpdate = {};
    if (fd.has("category")) payload.category = Number(fd.get("category") || 0);
    if (fd.has("title")) payload.title = String(fd.get("title") || "");
    if (fd.has("content")) payload.content = String(fd.get("content") || "");
    const jf = fd.get("journal_file") as File | null;
    if (jf instanceof File) payload.journal_file = jf;
    const imgs = fd.getAll("additional_images").filter(Boolean) as File[];
    if (imgs.length) payload.additional_images = imgs;
    return payload;
}

function normalizeListResponse(res: any): { arr: News[]; tot: number } {
    if (Array.isArray(res)) {
        return { arr: res, tot: res.length };
    }
    const arr = Array.isArray(res?.results) ? (res.results as News[]) : [];
    const tot =
        typeof res?.total === "number"
            ? res.total
            : typeof res?.count === "number"
                ? res.count
                : arr.length;
    return { arr, tot };
}

const NewsPage: React.FC = () => {
    const { categoryId } = useParams<{ categoryId: string }>();
    const categoryNum = Number(categoryId);

    const [categoryName, setCategoryName] = useState<string>("");
    const [items, setItems] = useState<News[]>([]);
    const [loading, setLoading] = useState(false);

    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState<News | undefined>(undefined);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const mountedRef = useRef(false);

    useEffect(() => {
        (async () => {
            try {
                const cats = await categoryNewsService.list(); // [{id, name}]
                const found = (cats || []).find((c: any) => c.id === categoryNum);
                setCategoryName(found?.name || "");
            } catch {
                setCategoryName("");
            }
        })();
    }, [categoryNum]);

    const fetchData = async () => {
        if (!Number.isFinite(categoryNum) || !categoryNum) return;
        try {
            setLoading(true);
            const res: any = await newsService.listByCategoryInfo(categoryNum, {
                page,
                page_size: pageSize,
            });
            const { arr, tot } = normalizeListResponse(res);
            setItems(arr);
            setTotal(tot);
        } catch {
            setItems([]);
            setTotal(0);
            toast.error("Ma`lumotni yuklashda xatolik", { toastId: TOAST.LOAD_ERR });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        if (!mountedRef.current) mountedRef.current = true;
    }, [categoryNum, page, pageSize]); // <-- params qo'shildi

    const pageSlice = useMemo(() => items, [items]);

    const handleAdd = () => {
        setEditData(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (row: News) => {
        setEditData(row);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (deleteId == null) return;
        try {
            await newsService.remove(deleteId);
            toast.success("Ma`lumot o‘chirildi!", { toastId: TOAST.DELETE_OK });

            const nextTotal = Math.max(0, total - 1);
            const maxPage = Math.max(1, Math.ceil(nextTotal / pageSize));
            if (page > maxPage) setPage(maxPage);

            await fetchData();
        } catch {
            toast.error("Ma`lumotni o‘chirishda xatolik", { toastId: TOAST.ACTION_ERR });
        } finally {
            setIsDeleteModalOpen(false);
            setDeleteId(null);
        }
    };

    const handleFormSubmit = async (fd: FormData, id?: number) => {
        try {
            if (id) {
                const payload = fdToUpdatePayload(fd);
                await newsService.update(id, payload);
                toast.success("Ma`lumot yangilandi!", { toastId: TOAST.UPDATE_OK });
            } else {
                if (!fd.get("category")) fd.set("category", String(categoryNum));
                const payload = fdToCreatePayload(fd);
                await newsService.create(payload);
                toast.success("Ma`lumot yaratildi!", { toastId: TOAST.CREATE_OK });
            }
            await fetchData();
        } catch {
            toast.error("Saqlashda xatolik yuz berdi", { toastId: TOAST.ACTION_ERR });
        } finally {
            setIsModalOpen(false);
        }
    };

    return (
        <div className="position-page">
            <div className="header">
                <h2 className="title">{categoryName ? `Kategoriya: ${categoryName}` : "Yangiliklar"}</h2>
                <button className="add-btn" onClick={handleAdd} disabled={!categoryNum}>
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
                            <th>Sarlavha</th>
                            <th>Yaratilgan</th>
                            <th className="amal">Amallar</th>
                        </tr>
                        </thead>
                        <tbody>
                        {pageSlice.length ? (
                            pageSlice.map((row, index) => (
                                <tr key={row.id ?? index}>
                                    <td>{(page - 1) * pageSize + index + 1}</td>
                                    <td className="ellipsis" title={row.title}>
                                        {row.title}
                                    </td>
                                    <td>{row.created_at ? formatDT(row.created_at) : "—"}</td>

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
                                <td colSpan={5} style={{ textAlign: "center" }}>
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
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setPage(1);
                        }}
                    />
                </div>
            )}

            <NewsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={
                    editData
                        ? {
                            id: editData.id,
                            category: editData.category,
                            category_name: editData.category_name,
                            title: editData.title,
                            content: editData.content,
                            journal_file_url: (editData as any).journal_file || null,
                            main_image_url: editData.main_image || null,
                            additional_images_urls: (editData.additional_images || []).map((it: any) =>
                                typeof it === "string" ? it : it?.image || it?.url || ""
                            ),
                        }
                        : { category: categoryNum }
                }
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

export default NewsPage;
