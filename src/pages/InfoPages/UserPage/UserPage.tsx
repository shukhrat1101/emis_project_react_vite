import React, { useEffect, useMemo, useState } from "react";
import { IoMdAddCircle } from "react-icons/io";
import { FaEdit, FaCheckSquare, FaWindowClose } from "react-icons/fa";
import { FaTrashCan, FaRegEye } from "react-icons/fa6";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../../../components/UI/Loader";
import Pagination from "../../../components/UI/Pagination";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import UserModal, { UserInitial } from "../../../components/Modals/User/UserModal";
import ProfileModal from "../../../components/Modals/User/ProfileModal";
import userService, { User, UserListResponse } from "../../../services/userService";
import "./UserPage.scss";

const TOAST = {
    LOAD_ERR: "user-load-err",
    CREATE_OK: "user-create-ok",
    UPDATE_OK: "user-update-ok",
    DELETE_OK: "user-del-ok",
    ACTION_ERR: "user-action-err",
};

const fmtDT = (s?: string) => {
    if (!s) return "—";
    try {
        return new Date(s).toLocaleString("uz-UZ");
    } catch {
        return s;
    }
};

function extractApiErrors(err: any): string[] {
    const msgs: string[] = [];
    const data = err?.response?.data;

    const collect = (v: any) => {
        if (!v && v !== 0) return;
        if (typeof v === "string") msgs.push(v);
        else if (Array.isArray(v)) v.forEach(collect);
        else if (typeof v === "object") Object.values(v).forEach(collect);
    };

    if (data) collect(data);
    if (!msgs.length) msgs.push("Xatolik yuz berdi.");
    return msgs;
}

const UserPage: React.FC = () => {
    const [rows, setRows] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    const [modalOpen, setModalOpen] = useState(false);
    const [initial, setInitial] = useState<UserInitial | undefined>(undefined);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [delId, setDelId] = useState<number | null>(null);

    const [profileOpen, setProfileOpen] = useState(false);
    const [profileUserId, setProfileUserId] = useState<number | string | null>(null);

    const load = async () => {
        try {
            setLoading(true);
            const res: UserListResponse = await userService.list({ page, page_size: pageSize });
            setRows(res.results || []);
            setTotal(res.total || 0);
        } catch {
            setRows([]);
            setTotal(0);
            toast.error("Ma'lumotni yuklashda xatolik", { toastId: TOAST.LOAD_ERR });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [page, pageSize]);

    const pageSlice = useMemo(() => rows, [rows]);

    return (
        <div className="department-table-page">
            <div className="header">
                <h2 className="title">Foydalanuvchilar</h2>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button
                        className="add-btn"
                        onClick={() => {
                            setInitial(undefined);
                            setModalOpen(true);
                        }}
                    >
                        <IoMdAddCircle /> Qo‘shish
                    </button>
                </div>
            </div>

            {loading ? (
                <Loader />
            ) : (
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                        <tr>
                            <th>T/R</th>
                            <th>Foydalanuvchi</th>
                            <th>Rol</th>
                            <th>Bo‘lim</th>
                            <th>CRUD</th>
                            <th>Faol</th>
                            <th>Profil</th>
                            <th>Yaratilgan</th>
                            <th className="amal">Amallar</th>
                        </tr>
                        </thead>
                        <tbody>
                        {pageSlice.length ? (
                            pageSlice.map((u, i) => (
                                <tr key={u.id}>
                                    <td>{(page - 1) * pageSize + i + 1}</td>
                                    <td>{u.username}</td>
                                    <td>{u.role}</td>
                                    <td>{u.department || "—"}</td>

                                    <td>
                                        {u.can_crud ? (
                                            <FaCheckSquare size={18} style={{ color: "#16a34a" }} title="Ha" />
                                        ) : (
                                            <FaWindowClose size={18} style={{ color: "#dc2626" }} title="Yo‘q" />
                                        )}
                                    </td>

                                    <td>
                                        {u.is_active ? (
                                            <FaCheckSquare size={18} style={{ color: "#16a34a" }} title="Ha" />
                                        ) : (
                                            <FaWindowClose size={18} style={{ color: "#dc2626" }} title="Yo‘q" />
                                        )}
                                    </td>

                                    {/* Profil */}
                                    <td className="actions">
                                        <button
                                            className="btn detail"
                                            title="Profil"
                                            onClick={() => {
                                                setProfileUserId(u.id);
                                                setProfileOpen(true);
                                            }}
                                        >
                                            <FaRegEye />
                                        </button>
                                    </td>

                                    <td>{fmtDT(u.created_at)}</td>

                                    <td className="actions">
                                        <div className="actions-inner">
                                            <button
                                                className="btn edit"
                                                title="Tahrirlash"
                                                onClick={() => {
                                                    const init: UserInitial = {
                                                        id: u.id,
                                                        username: u.username,
                                                        role: u.role,
                                                        department_name: u.department,
                                                        can_crud: u.can_crud,
                                                        is_active: u.is_active,
                                                        is_staff: u.is_staff,
                                                        is_superuser: u.is_superuser,
                                                    };
                                                    setInitial(init);
                                                    setModalOpen(true);
                                                }}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="btn delete"
                                                title="O‘chirish"
                                                onClick={() => {
                                                    setDelId(u.id);
                                                    setConfirmOpen(true);
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
                                <td colSpan={9} style={{ textAlign: "center" }}>
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

            <UserModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                initialData={initial}
                onSubmit={async (payload, id) => {
                    try {
                        if (id) {
                            await userService.update(id, payload);
                            toast.success("Ma'lumot yangilandi!", { toastId: TOAST.UPDATE_OK });
                        } else {
                            await userService.create(payload);
                            toast.success("Ma'lumot yaratildi!", { toastId: TOAST.CREATE_OK });
                        }
                        await load();
                    } catch (err) {
                        extractApiErrors(err).forEach((m, idx) =>
                            toast.error(m, { toastId: `${TOAST.ACTION_ERR}-${idx}-${m}` })
                        );
                        throw err;
                    }
                }}
            />

            <ConfirmModal
                isOpen={confirmOpen}
                text="Foydalanuvchini o‘chirmoqchimisiz?"
                onCancel={() => setConfirmOpen(false)}
                onConfirm={async () => {
                    if (delId == null) return;
                    try {
                        await userService.remove(delId);
                        toast.success("O‘chirildi!", { toastId: TOAST.DELETE_OK });
                        const newTotal = Math.max(0, total - 1);
                        const maxPage = Math.max(1, Math.ceil(newTotal / pageSize));
                        if (page > maxPage) setPage(maxPage);
                        await load();
                    } catch (err) {
                        extractApiErrors(err).forEach((m, idx) =>
                            toast.error(m, { toastId: `${TOAST.ACTION_ERR}-${idx}-${m}` })
                        );
                    } finally {
                        setConfirmOpen(false);
                        setDelId(null);
                    }
                }}
            />

            <ProfileModal
                isOpen={profileOpen}
                onClose={() => setProfileOpen(false)}
                userId={profileUserId}
            />
        </div>
    );
};

export default UserPage;
