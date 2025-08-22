import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import unitService from "../../../services/unitService";
import Pagination from "../../../components/UI/Pagination";
import Loader from "../../../components/UI/Loader";
import "./UnitPage.scss";
import "../../../style/global.scss";
import { IoMdAddCircle } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";
import { BsBuildingsFill } from "react-icons/bs";
import AddEditModal from "../../../components/Modals/Unit/UnitModal";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Department {
    id: number;
    name: string;
    address: string;
    parent_id: string;
    image?: string;
}

const TOAST = {
    LOAD_ERR: "unit-load-error",
    CREATE_OK: "unit-create-ok",
    UPDATE_OK: "unit-update-ok",
    DELETE_OK: "unit-delete-ok",
    ACTION_ERR: "unit-action-error",
};

function extractMessages(payload: any): string[] {
    const out: string[] = [];
    const walk = (v: any) => {
        if (v == null) return;
        if (typeof v === "string") out.push(v);
        else if (Array.isArray(v)) v.forEach(walk);
        else if (typeof v === "object") Object.values(v).forEach(walk);
    };
    walk(payload);
    return out;
}

function normalizeAxiosReturn(ret: any) {
    return ret && typeof ret === "object" && "data" in ret ? ret.data : ret;
}

const DepartmentTablePage: React.FC = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState<Department | undefined>(undefined);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const navigate = useNavigate();

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const response = await unitService.getAll(page, pageSize);
            const data = normalizeAxiosReturn(response);
            setDepartments(data?.results || []);
            setTotal(data?.total || 0);
            const msgs = extractMessages(data?.message ?? data?.detail);
            msgs.forEach((m, i) => toast.info(m, { toastId: `unit-info-${i}-${m}` }));
        } catch (error: any) {
            const msgs = extractMessages(error?.response?.data);
            if (msgs.length) {
                msgs.forEach((m, i) => toast.error(m, { toastId: `${TOAST.LOAD_ERR}-${i}-${m}` }));
            } else {
                toast.error("Bo‘linmalarni yuklashda xatolik!", { toastId: TOAST.LOAD_ERR });
            }
            setDepartments([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, [page, pageSize]);

    const handleAdd = () => {
        setEditData(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (department: Department) => {
        setEditData(department);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (deleteId === null) return;
        try {
            const ret = await unitService.delete(deleteId);
            const data = normalizeAxiosReturn(ret);
            toast.success("Ma'lumot o‘chirildi!", { toastId: TOAST.DELETE_OK });
            const msgs = extractMessages(data?.message ?? data?.detail);
            msgs.forEach((m, i) => toast.success(m, { toastId: `${TOAST.DELETE_OK}-msg-${i}-${m}` }));
            setDeleteId(null);
            setIsDeleteModalOpen(false);
            fetchDepartments();
        } catch (error: any) {
            const msgs = extractMessages(error?.response?.data);
            if (msgs.length) {
                msgs.forEach((m, i) => toast.error(m, { toastId: `${TOAST.ACTION_ERR}-${i}-${m}` }));
            } else {
                toast.error("O‘chirishda xatolik yuz berdi!", { toastId: TOAST.ACTION_ERR });
            }
        }
    };

    const handleFormSubmit = async (formData: FormData) => {
        try {
            if (editData?.id) {
                const ret = await unitService.update(editData.id, formData);
                const data = normalizeAxiosReturn(ret);
                toast.success("Ma'lumot yangilandi!", { toastId: TOAST.UPDATE_OK });
                const msgs = extractMessages(data?.message ?? data?.detail);
                msgs.forEach((m, i) => toast.success(m, { toastId: `${TOAST.UPDATE_OK}-msg-${i}-${m}` }));
            } else {
                const ret = await unitService.create(formData);
                const data = normalizeAxiosReturn(ret);
                toast.success("Ma'lumot saqlandi!", { toastId: TOAST.CREATE_OK });
                const msgs = extractMessages(data?.message ?? data?.detail);
                msgs.forEach((m, i) => toast.success(m, { toastId: `${TOAST.CREATE_OK}-msg-${i}-${m}` }));
            }
            fetchDepartments();
        } catch (error: any) {
            const msgs = extractMessages(error?.response?.data);
            if (msgs.length) {
                msgs.forEach((m, i) => toast.error(m, { toastId: `${TOAST.ACTION_ERR}-${i}-${m}` }));
            } else {
                toast.error("Saqlashda xatolik yuz berdi!", { toastId: TOAST.ACTION_ERR });
            }
        } finally {
            setIsModalOpen(false);
        }
    };

    return (
        <div className="department-table-page">
            <div className="header">
                <h2 className="title">Birlashmalar ro‘yxati</h2>
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
                            <th>Rasmi</th>
                            <th>Birlashma nomi</th>
                            <th>Manzil</th>
                            <th className="amal">Amallar</th>
                        </tr>
                        </thead>
                        <tbody>
                        {Array.isArray(departments) && departments.length > 0 ? (
                            departments.map((dep, index) => (
                                <tr key={dep.id}>
                                    <td>{(page - 1) * pageSize + index + 1}</td>
                                    <td>
                                        {dep.image ? (
                                            <img src={dep.image} alt={dep.name} className="department-img" />
                                        ) : (
                                            <BsBuildingsFill className="department-icon" />
                                        )}
                                    </td>
                                    <td
                                        className="clickable"
                                        onClick={() => navigate(`/malumotnoma/birlashma/${dep.id}/bolinmalar`)}
                                    >
                                        {dep.name}
                                    </td>
                                    <td>{dep.address}</td>
                                    <td className="actions">
                                        <div className="actions-inner">
                                            <button className="btn edit" onClick={() => handleEdit(dep)}>
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="btn delete"
                                                onClick={() => {
                                                    setDeleteId(dep.id);
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
                                <td colSpan={5} style={{ textAlign: "center" }}>
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

            <AddEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editData}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                text="Haqiqatan ham o‘chirmoqchimisiz?"
                onCancel={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
            />
        </div>
    );
};

export default DepartmentTablePage;
