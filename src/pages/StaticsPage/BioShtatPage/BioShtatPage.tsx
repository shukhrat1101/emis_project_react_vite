import React, { useEffect, useMemo, useRef, useState } from "react";
import { IoMdAddCircle } from "react-icons/io";
import { FaEdit, FaUser } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";
import { MdGavel } from "react-icons/md";
import { toast } from "react-toastify";
import userService, { type CurrentUser } from "../../../services/userService";
import unitService from "../../../services/unitService";
import bioShtatService, { type BioGroup, type BioPerson } from "../../../services/bioShtatService";
import Loader from "../../../components/UI/Loader";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import BioModal from "../../../components/Modals/BioShtat/BioShtatModal";
import "../../../style/global.scss";
import "./BioShtatPage.scss";
import {useNavigate} from "react-router-dom";

type Unit = { id: number; name: string };

function extractApiErrors(err: any): string[] {
    const msgs: string[] = [];
    const data = err?.response?.data;
    const walk = (v: any) => {
        if (v == null) return;
        if (typeof v === "string") msgs.push(v);
        else if (Array.isArray(v)) v.forEach(walk);
        else if (typeof v === "object") Object.values(v).forEach(walk);
    };
    if (data) walk(data);
    if (!msgs.length) msgs.push("Xatolik yuz berdi.");
    return Array.from(new Set(msgs.map((s) => s.trim()).filter(Boolean))).slice(0, 8);
}

const toLower = (x: any) => String(x ?? "").toLowerCase();
const isOperative = (t: any) => toLower(t).startsWith("operativ");
const isStrategic = (t: any) => toLower(t).startsWith("strateg");

const BioShtatPage: React.FC = () => {
    const [me, setMe] = useState<CurrentUser | null>(null);
    const [roleReady, setRoleReady] = useState(false);

    const isSuper = me?.role === "superadmin";
    const isAdmin = me?.role === "admin";
    const isUser = me?.role === "user";

    const [units, setUnits] = useState<Unit[]>([]);
    const [activeUnitId, setActiveUnitId] = useState<number | null>(null);

    const [groups, setGroups] = useState<BioGroup[]>([]);
    const [loading, setLoading] = useState(false);

    const [subTab, setSubTab] = useState<"dept" | "subs">("dept");

    const [detailOpen, setDetailOpen] = useState(false);
    const [detailPerson, setDetailPerson] = useState<BioPerson | null>(null);
    const overlayRef = useRef<HTMLDivElement | null>(null);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ groupId: number; personId: number } | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editPerson, setEditPerson] = useState<BioPerson | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const data = await userService.me();
                setMe(data);
            } catch {
                setMe(null);
            } finally {
                setRoleReady(true);
            }
        })();
    }, []);

    useEffect(() => {
        if (!roleReady || !isSuper) return;
        (async () => {
            try {
                const list = await unitService.getAllUnits();
                setUnits(list);
                if (list.length && activeUnitId == null) setActiveUnitId(list[0].id);
            } catch (e: any) {
                extractApiErrors(e).forEach((m, i) => toast.error(m, { toastId: `bio-unit-${i}-${m}` }));
                setUnits([]);
            }
        })();
    }, [roleReady, isSuper]);

    const loadData = async () => {
        if (!roleReady) return;
        try {
            setLoading(true);
            let data: BioGroup[] = [];
            if (isSuper) {
                if (activeUnitId == null) data = [];
                else data = await bioShtatService.listByUnit(activeUnitId);
            } else {
                data = await bioShtatService.listAll();
            }
            setGroups(Array.isArray(data) ? data : []);
        } catch (e: any) {
            extractApiErrors(e).forEach((m, i) => toast.error(m, { toastId: `bio-load-${i}-${m}` }));
            setGroups([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [roleReady, isSuper, activeUnitId]);

    const adminDeptGroups = useMemo(() => groups.filter((g) => isOperative(g.type)), [groups]);
    const adminSubsGroups = useMemo(() => groups.filter((g) => !isOperative(g.type)), [groups]);

    const deptName = useMemo(() => {
        const g = adminDeptGroups[0] ?? groups[0];
        return g?.department || "Boshqarma";
    }, [adminDeptGroups, groups]);

    const displayGroups: BioGroup[] = useMemo(() => {
        if (isAdmin) return subTab === "dept" ? adminDeptGroups : adminSubsGroups;
        return groups;
    }, [isAdmin, subTab, adminDeptGroups, adminSubsGroups, groups]);

    const superHasStrategic = useMemo(() => isSuper && groups.some((g) => isStrategic(g.type)), [isSuper, groups]);

    const showActionsColumn = isUser || (isAdmin && subTab === "dept") || (isSuper && superHasStrategic);

    const openDetail = (p: BioPerson) => {
        setDetailPerson(p);
        setDetailOpen(true);
        setTimeout(() => overlayRef.current?.focus(), 0);
    };

    const goDiscipline = (p: BioPerson) => {
        navigate(`/bioshtat/intizomiy/${p.id}`);
    };

    const askDelete = (groupId: number, personId: number) => {
        setDeleteTarget({ groupId, personId });
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await bioShtatService.remove(deleteTarget.personId);
            toast.success("Maʼlumot o‘chirildi");
            await loadData();
        } catch (e: any) {
            extractApiErrors(e).forEach((m, i) => toast.error(m, { toastId: `bio-del-${i}-${m}` }));
        } finally {
            setIsDeleteOpen(false);
            setDeleteTarget(null);
        }
    };

    const openCreate = () => {
        setEditPerson(null);
        setIsModalOpen(true);
    };

    const openEdit = (p: BioPerson) => {
        setEditPerson(p);
        setIsModalOpen(true);
    };

    const onSaved = async () => {
        await loadData();
    };

    const columnCount = 10 + (showActionsColumn ? 1 : 0);

    return (
        <div className="bioshtat-page">
            <div className="header">
                <h2 className="title">Biografik maʼlumotlar</h2>
                <button className="add-btn" onClick={openCreate}>
                    <IoMdAddCircle /> Qo‘shish
                </button>
            </div>

            {isSuper && units.length > 0 && (
                <div className="tabs-left">
                    {units.map((u) => (
                        <button
                            key={u.id}
                            className={`tab ${activeUnitId === u.id ? "active" : ""}`}
                            onClick={() => setActiveUnitId(u.id)}
                            title={u.name}
                        >
                            {u.name}
                        </button>
                    ))}
                </div>
            )}

            {isAdmin && (
                <div className="tabs-left" style={{ marginTop: units.length ? 8 : 0 }}>
                    <button className={`tab ${subTab === "dept" ? "active" : ""}`} onClick={() => setSubTab("dept")} title={deptName}>
                        {deptName}
                    </button>
                    <button className={`tab ${subTab === "subs" ? "active" : ""}`} onClick={() => setSubTab("subs")}>
                        Bo‘linmalari
                    </button>
                </div>
            )}

            {loading ? (
                <Loader />
            ) : displayGroups.length === 0 ? (
                <div className="empty-state" style={{ minHeight: "48vh", display: "grid", placeItems: "center" }}>
                    <div className="empty-text">Maʼlumot mavjud emas!</div>
                </div>
            ) : (
                <div className="table-wrapper bioshtat-table-wrapper">
                    <table className="table bioshtat-table">
                        <thead>
                        <tr>
                            <th style={{ width: 60 }}>T/R</th>
                            <th style={{ width: 80 }}>Rasm</th>
                            <th>Unvoni</th>
                            <th>F.I.Sh.</th>
                            <th>Lavozimi</th>
                            <th>Malakasi</th>
                            <th>Millati</th>
                            <th>Tug‘ilgan joyi</th>
                            <th style={{ width: 120 }}>Batafsil</th>
                            <th style={{ width: 140 }}>Intizomiy holat</th>
                            {showActionsColumn && (
                                <th className="amal" style={{ width: 120 }}>
                                    Amallar
                                </th>
                            )}
                        </tr>
                        </thead>

                        <tbody>
                        {displayGroups.map((g) => {
                            const people = g.biografic_data_department || [];
                            return (
                                <React.Fragment key={g.id}>
                                    <tr className="group-row">
                                        <td className="group-cell" colSpan={columnCount}>
                                            <div className="group-bar">
                                                <div className="group-name">{g.name}</div>
                                                <div className="group-meta">
                                                    <span className="badge">{g.type}</span>
                                                    <span className="dept">• {g.department}</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>

                                    {people.length === 0 ? (
                                        <tr>
                                            <td colSpan={columnCount} style={{ color: "#6b7280", fontStyle: "italic" }}>
                                                Ushbu bo‘linmada xodim topilmadi.
                                            </td>
                                        </tr>
                                    ) : (
                                        people.map((p, idx) => {
                                            const photo =
                                                p.photo || "https://static-00.iconduck.com/assets.00/user-icon-512x512-3mby0cb8.png";
                                            const canRowActions = isUser || (isSuper && isStrategic(g.type)) || (isAdmin && subTab === "dept");
                                            return (
                                                <tr key={p.id}>
                                                    <td>{idx + 1}</td>
                                                    <td>
                                                        <img
                                                            src={photo}
                                                            alt={p.full_name}
                                                            style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 8 }}
                                                        />
                                                    </td>
                                                    <td>{p.rank || "—"}</td>
                                                    <td>{p.full_name}</td>
                                                    <td>{p.position || "—"}</td>
                                                    <td>{(p as any).qualfication || "—"}</td>
                                                    <td>{p.nationality || "—"}</td>
                                                    <td>{p.born_place || "—"}</td>
                                                    <td>
                                                        <button className="btn detail" onClick={() => openDetail(p)} title="Batafsil">
                                                            <FaUser />
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <button className="btn detail" onClick={() => goDiscipline(p)} title="Intizomiy holat">
                                                            <MdGavel />
                                                        </button>
                                                    </td>
                                                    {showActionsColumn && (
                                                        <td className="actions">
                                                            {canRowActions ? (
                                                                <div className="actions-inner">
                                                                    <button className="btn edit" title="Tahrirlash" onClick={() => openEdit(p)}>
                                                                        <FaEdit />
                                                                    </button>
                                                                    <button className="btn delete" title="O‘chirish" onClick={() => askDelete(g.id, p.id)}>
                                                                        <FaTrashCan />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div style={{ color: "#9ca3af", fontSize: 12 }}>—</div>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })
                                    )}
                                </React.Fragment>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmModal
                isOpen={isDeleteOpen}
                text="Ushbu xodim yozuvini o‘chirmoqchimisiz?"
                onCancel={() => setIsDeleteOpen(false)}
                onConfirm={confirmDelete}
            />

            {detailOpen && detailPerson && (
                <div
                    ref={overlayRef}
                    className="img-modal-overlay"
                    tabIndex={-1}
                    onKeyDown={(e) => e.key === "Escape" && setDetailOpen(false)}
                    onMouseDown={(e) => e.target === e.currentTarget && setDetailOpen(false)}
                >
                    <div className="bio-modal">
                        <div className="bio-modal-body">
                            <div className="bio-right" style={{ width: "100%" }}>
                                <div className="detail-table-wrapper">
                                    <table className="detail-table">
                                        <tbody>
                                        <tr><td className="key">F.I.Sh.</td><td className="val">{detailPerson.full_name || "—"}</td></tr>
                                        <tr><td className="key">Lavozim sanasi</td><td className="val">{detailPerson.position_date || "—"}</td></tr>
                                        <tr><td className="key">O‘qigan kurslari</td><td className="val">{detailPerson.ended_courses || "—"}</td></tr>
                                        <tr><td className="key">Chetda bo‘lganmi</td><td className="val">{detailPerson.been_in_abroad || "—"}</td></tr>
                                        <tr><td className="key">Tug‘ilgan sana</td><td className="val">{detailPerson.born_date || "—"}</td></tr>
                                        <tr><td className="key">Manzili</td><td className="val">{detailPerson.live_place || "—"}</td></tr>
                                        <tr><td className="key">Telefon</td><td className="val">{detailPerson.phone_number || "—"}</td></tr>
                                        <tr><td className="key">Bo‘yi (sm)</td><td className="val">{detailPerson.height ?? "—"}</td></tr>
                                        <tr><td className="key">Vazni (kg)</td><td className="val">{detailPerson.weight ?? "—"}</td></tr>
                                        <tr><td className="key">Bola soni</td><td className="val">{detailPerson.child_count ?? "—"}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <BioModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={onSaved}
                groups={groups}
                defaultGroupId={null}
                person={editPerson}
                isSuper={isSuper}
            />
        </div>
    );
};

export default BioShtatPage;
