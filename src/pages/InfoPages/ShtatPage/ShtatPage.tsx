import React, { useEffect, useState } from "react";
import { IoMdAddCircle } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Pagination from "../../../components/UI/Pagination";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import Loader from "../../../components/UI/Loader";
import ShtatModal, { ShtatOut as ShtatOutLocal } from "../../../components/Modals/Shtat/ShtatModal";
import DetailModal from "../../../components/Modals/Shtat/DetailModal";

import shtatService, {
    Shtat,
    ContingentTable as ContingentTableAPI,
    ShtatListResponse,
} from "../../../services/shtatService";

import "./ShtatPage.scss";
import "../../../style/global.scss";

interface Position {
    id: number;
    name: string;
}
export interface ContingentTableForm {
    id: number;
    type: string;
    count_person: number;
    position: Position[];
}

const mapPositionEntry = (
    entry: string | number | { id: string | number; name: string },
    idx: number
): Position => {
    if (typeof entry === "string") return { id: idx, name: entry };
    if (typeof entry === "number") return { id: entry, name: String(entry) };
    return {
        id: typeof entry.id === "number" ? entry.id : Number(entry.id),
        name: entry.name,
    };
};

const toFormContingentTables = (
    tables: ContingentTableAPI[]
): ContingentTableForm[] => {
    return tables.map((t) => ({
        id: (t as { id?: number }).id ?? 0,
        type: t.type,
        count_person: t.count_person,
        position: (t.position ?? []).map(mapPositionEntry),
    }));
};

type GroupName = "Offitser" | "Serjant" | "Xizmatchi";
const toGroupName = (t: string): GroupName => {
    if (t === "Offitser") return "Offitser";
    if (t === "Serjant") return "Serjant";
    return "Xizmatchi";
};

const normalizeInitialForModal = (s: Shtat) => ({
    degree: String(s.degree ?? ""),
    contingent_tables: (s.contingent_tables ?? []).map((ct) => ({
        type: toGroupName(String(ct.type)), // string -> union literal
        count_person: Number(ct.count_person) || 0,
        position: (ct.position ?? []).map((p: any) =>
            typeof p === "object" && p !== null
                ? { id: p.id, name: p.name }
                : p
        ),
    })),
});

const TOAST = {
    LOAD_ERR: "shtat-load-error",
    CREATE_OK: "shtat-create-ok",
    UPDATE_OK: "shtat-update-ok",
    DELETE_OK: "shtat-delete-ok",
    ACTION_ERR: "shtat-action-error",
};

const ShtatPage: React.FC = () => {
    const [shtatlar, setShtatlar] = useState<Shtat[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState<Shtat | undefined>(undefined);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedShtat, setSelectedShtat] = useState<Shtat | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response: ShtatListResponse = await shtatService.getAll(page, pageSize);
            const rows = response.results ?? [];
            setShtatlar(rows);
            setTotal(Number(response.total ?? rows.length));
        } catch (e) {
            toast.error("Ma`lumotni yuklashda xatolik", { toastId: TOAST.LOAD_ERR });
            setShtatlar([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, pageSize]);

    const handleAdd = () => {
        setEditData(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (shtat: Shtat) => {
        setEditData(shtat);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (deleteId !== null) {
            try {
                await shtatService.delete(deleteId);
                toast.success("Ma`lumot o‘chirildi!", { toastId: TOAST.DELETE_OK });
                fetchData();
            } catch (e) {
                toast.error("Ma`lumotni o‘chirishda xatolik", { toastId: TOAST.ACTION_ERR });
            } finally {
                setDeleteId(null);
                setIsDeleteModalOpen(false);
            }
        }
    };

    const handleFormSubmit = async (formData: ShtatOutLocal) => {
        try {
            if (editData?.id) {
                await shtatService.update(editData.id, formData);
                toast.success("Ma`lumot yangilandi!", { toastId: TOAST.UPDATE_OK });
            } else {
                await shtatService.create(formData);
                toast.success("Ma`lumot yaratildi!", { toastId: TOAST.CREATE_OK });
            }
            fetchData();
        } catch (e) {
            toast.error("Saqlashda xatolik yuz berdi", { toastId: TOAST.ACTION_ERR });
        } finally {
            setIsModalOpen(false);
        }
    };

    const openDetailModal = (shtat: Shtat) => {
        setSelectedShtat(shtat);
        setIsDetailModalOpen(true);
    };

    return (
        <div className="shtat-page">
            <div className="header">
                <h2 className="title">Shtatlar ro‘yxati</h2>
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
                            <th>Darajasi</th>
                            <th>Shtat tarkibi</th>
                            <th className="amal">Amallar</th>
                        </tr>
                        </thead>
                        <tbody>
                        {shtatlar.length > 0 ? (
                            shtatlar.map((shtat, index) => (
                                <tr key={shtat.id ?? index}>
                                    <td>{(page - 1) * pageSize + index + 1}</td>
                                    <td>{shtat.degree}</td>
                                    <td>
                                        <button className="btn detail" onClick={() => openDetailModal(shtat)}>
                                            Batafsil
                                        </button>
                                    </td>
                                    <td className="actions">
                                        <div className="actions-inner">
                                            <button className="btn edit" onClick={() => handleEdit(shtat)}>
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="btn delete"
                                                onClick={() => {
                                                    setDeleteId(shtat.id ?? null);
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
                        onPageSizeChange={(newSize) => {
                            setPageSize(newSize);
                            setPage(1);
                        }}
                    />
                </div>
            )}

            <ShtatModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editData ? normalizeInitialForModal(editData) : undefined}
            />

            <DetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                positions={
                    selectedShtat ? toFormContingentTables(selectedShtat.contingent_tables) : []
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

export default ShtatPage;
