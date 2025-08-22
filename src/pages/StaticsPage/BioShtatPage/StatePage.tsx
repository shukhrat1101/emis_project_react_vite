import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { IoMdAddCircle } from "react-icons/io";
import { FaCheckCircle, FaEdit } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";
import { MdCancel } from "react-icons/md";
import { toast } from "react-toastify";
import userService, { type CurrentUser } from "../../../services/userService";
import stateService, { Award, Punishment } from "../../../services/stateService";
import bioShtatService from "../../../services/bioShtatService";
import Loader from "../../../components/UI/Loader";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import AwardModal, { AwardInitial } from "../../../components/Modals/State/AwardModal";
import PunishModal, { PunishInitial } from "../../../components/Modals/State/PunishModal";
import "../../../style/global.scss";
import "./StatePage.scss";

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

const StatePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const bioId = Number(id);

    const [me, setMe] = useState<CurrentUser | null>(null);
    const [ready, setReady] = useState(false);

    const [tab, setTab] = useState<"awards" | "punishments">("awards");

    const [awards, setAwards] = useState<Award[]>([]);
    const [punishments, setPunishments] = useState<Punishment[]>([]);
    const [loading, setLoading] = useState(false);

    const [awardOpen, setAwardOpen] = useState(false);
    const [editAward, setEditAward] = useState<Award | null>(null);

    const [punishOpen, setPunishOpen] = useState(false);
    const [editPunish, setEditPunish] = useState<Punishment | null>(null);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmType, setConfirmType] = useState<"award" | "punish" | null>(null);
    const [confirmId, setConfirmId] = useState<number | null>(null);

    const [bioOwnerId, setBioOwnerId] = useState<number | null>(null);

    const [expanded, setExpanded] = useState<{ type: "awards" | "punishments"; id: number } | null>(null);

    const overlayRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const u = await userService.me();
                setMe(u);
            } catch {
                setMe(null);
            } finally {
                setReady(true);
            }
        })();
    }, []);

    const loadAll = async () => {
        if (!ready || !bioId) return;
        try {
            setLoading(true);
            const [as, ps] = await Promise.all([stateService.listAwards(bioId), stateService.listPunishments(bioId)]);
            setAwards(as as any);
            setPunishments(ps as any);
        } catch (e: any) {
            extractApiErrors(e).forEach((m, i) => toast.error(m, { toastId: `state-load-${i}-${m}` }));
            setAwards([]);
            setPunishments([]);
        } finally {
            setLoading(false);
        }
    };

    const loadBioOwner = async () => {
        if (!ready || !bioId) return;
        try {
            const person: any = await bioShtatService.getOne(bioId);
            const cb = typeof person?.created_by === "object" ? person?.created_by?.id : person?.created_by;
            setBioOwnerId(typeof cb === "number" ? cb : null);
        } catch {
            setBioOwnerId(null);
        }
    };

    useEffect(() => {
        loadAll();
    }, [ready, bioId]);

    useEffect(() => {
        loadBioOwner();
    }, [ready, bioId]);

    useEffect(() => {
        setExpanded(null);
    }, [tab]);

    const canAdd = !!me?.id && bioOwnerId === me.id;

    const canEditRow = (createdBy?: any) => {
        if (!me || !createdBy) return false;
        const id = typeof createdBy === "object" ? createdBy.id : createdBy;
        return me.id === id;
    };

    const openCreateAward = () => {
        setEditAward(null);
        setAwardOpen(true);
    };
    const openEditAward = (row: Award) => {
        setEditAward(row);
        setAwardOpen(true);
    };

    const openCreatePunish = () => {
        setEditPunish(null);
        setPunishOpen(true);
    };
    const openEditPunish = (row: Punishment) => {
        setEditPunish(row);
        setPunishOpen(true);
    };

    const handleAwardSubmit = async (payload: AwardInitial, id?: number) => {
        try {
            if (id) {
                await stateService.updateAward(id, {
                    biografic_data: payload.biografic_data,
                    awarded_by: payload.awarded_by,
                    command_number: payload.command_number,
                    awarded_date: payload.awarded_date,
                    award_name: payload.award_name,
                });
                toast.success("Rag‘batlantirish yangilandi");
            } else {
                await stateService.createAward({
                    biografic_data: bioId,
                    awarded_by: payload.awarded_by,
                    command_number: payload.command_number,
                    awarded_date: payload.awarded_date,
                    award_name: payload.award_name,
                });
                toast.success("Rag‘batlantirish qo‘shildi");
            }
            await loadAll();
        } catch (e: any) {
            extractApiErrors(e).forEach((m, i) => toast.error(m, { toastId: `award-save-${i}-${m}` }));
        }
    };

    const handlePunishSubmit = async (payload: PunishInitial, id?: number) => {
        try {
            const base = {
                biografic_data: bioId,
                who_punished: payload.who_punished,
                punishment_name: payload.punishment_name,
                punishment_date: payload.punishment_date,
                is_finished: payload.is_finished,
            };
            const body = payload.is_finished
                ? { ...base, finished_date: payload.finished_date || payload.punishment_date }
                : { ...base, finished_date: null };

            if (id) {
                await stateService.updatePunishment(id, body);
                toast.success("Intizomiy taʼzir yangilandi");
            } else {
                await stateService.createPunishment(body);
                toast.success("Intizomiy taʼzir qo‘shildi");
            }
            await loadAll();
        } catch (e: any) {
            extractApiErrors(e).forEach((m, i) => toast.error(m, { toastId: `punish-save-${i}-${m}` }));
        }
    };

    const askDeleteAward = (id: number) => {
        setConfirmType("award");
        setConfirmId(id);
        setConfirmOpen(true);
    };
    const askDeletePunish = (id: number) => {
        setConfirmType("punish");
        setConfirmId(id);
        setConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!confirmType || confirmId == null) return;
        try {
            if (confirmType === "award") {
                await stateService.deleteAward(confirmId);
                toast.success("Rag‘batlantirish o‘chirildi");
            } else {
                await stateService.deletePunishment(confirmId);
                toast.success("Intizomiy taʼzir o‘chirildi");
            }
            setConfirmOpen(false);
            setConfirmId(null);
            await loadAll();
        } catch (e: any) {
            extractApiErrors(e).forEach((m, i) => toast.error(m, { toastId: `state-del-${i}-${m}` }));
        }
    };

    const truncate = (s: string, n = 40) => {
        if (!s) return "";
        return s.length > n ? s.slice(0, n) + "…" : s;
    };
    const isExpanded = (type: "awards" | "punishments", id: number) =>
        expanded && expanded.type === type && expanded.id === id;
    const toggleExpand = (type: "awards" | "punishments", id: number) => {
        if (isExpanded(type, id)) setExpanded(null);
        else setExpanded({ type, id });
    };

    const awardsScrollable = awards.length > 15;
    const punishScrollable = punishments.length > 15;

    return (
        <div className="techbase-page" ref={overlayRef}>
            <div className="header">
                <h2 className="title">Rag‘batlantirishlar / Intizomiy taʼzirlar</h2>
                {canAdd &&
                    (tab === "awards" ? (
                        <button className="add-btn" onClick={openCreateAward}>
                            <IoMdAddCircle /> Qo‘shish
                        </button>
                    ) : (
                        <button className="add-btn" onClick={openCreatePunish}>
                            <IoMdAddCircle /> Qo‘shish
                        </button>
                    ))}
            </div>

            <div className="tabs-left">
                <button className={`tab ${tab === "awards" ? "active" : ""}`} onClick={() => setTab("awards")}>
                    Rag‘batlantirishlar
                </button>
                <button className={`tab ${tab === "punishments" ? "active" : ""}`} onClick={() => setTab("punishments")}>
                    Intizomiy taʼzirlar
                </button>
            </div>

            {loading ? (
                <Loader />
            ) : tab === "awards" ? (
                <div
                    className="table-wrapper"
                    style={awardsScrollable ? { maxHeight: 650, overflowY: "auto" } : undefined}
                >
                    <table className="table">
                        <thead
                            style={{
                                position: "sticky",
                                top: 0,
                                zIndex: 2,
                                background: "rgba(119, 159, 228, 0.53)",
                            }}
                        >
                        <tr>
                            <th style={{ width: 60 }}>T/R</th>
                            <th>Kim tomonidan</th>
                            <th>Buyruq raqami</th>
                            <th>Sana</th>
                            <th>Mukofot nomi</th>
                            {canAdd && <th className="amal" style={{ width: 120 }}>Amallar</th>}
                        </tr>
                        </thead>
                        <tbody>
                        {awards.length === 0 ? (
                            <tr>
                                <td colSpan={canAdd ? 6 : 5} style={{ color: "#6b7280", fontStyle: "italic" }}>
                                    Maʼlumot mavjud emas
                                </td>
                            </tr>
                        ) : (
                            awards.map((a, i) => {
                                const rowActions = canAdd && canEditRow(a.created_by as any);
                                const showMore = a.award_name && a.award_name.length > 40;
                                const expandedNow = isExpanded("awards", a.id);
                                return (
                                    <tr key={a.id}>
                                        <td>{i + 1}</td>
                                        <td>{a.awarded_by}</td>
                                        <td>{a.command_number}</td>
                                        <td>{a.awarded_date}</td>
                                        <td>
                                            {expandedNow ? (
                                                <>
                                                    {a.award_name}
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpanded(null)}
                                                        style={{
                                                            marginLeft: 8,
                                                            background: "transparent",
                                                            border: "none",
                                                            color: "#1b4f72",
                                                            textDecoration: "underline",
                                                            cursor: "pointer",
                                                            fontSize: 12,
                                                        }}
                                                    >
                                                        Yopish
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    {truncate(a.award_name, 40)}
                                                    {showMore && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpand("awards", a.id)}
                                                            style={{
                                                                marginLeft: 8,
                                                                background: "transparent",
                                                                border: "none",
                                                                color: "#1b4f72",
                                                                textDecoration: "underline",
                                                                cursor: "pointer",
                                                                fontSize: 12,
                                                            }}
                                                        >
                                                            Batafsil
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                        {canAdd && (
                                            <td className="actions">
                                                {rowActions ? (
                                                    <div className="actions-inner">
                                                        <button className="btn edit" title="Tahrirlash" onClick={() => openEditAward(a)}>
                                                            <FaEdit />
                                                        </button>
                                                        <button className="btn delete" title="O‘chirish" onClick={() => askDeleteAward(a.id)}>
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
                        </tbody>
                    </table>
                </div>
            ) : (
                <div
                    className="table-wrapper"
                    style={punishScrollable ? { maxHeight: 650, overflowY: "auto" } : undefined}
                >
                    <table className="table">
                        <thead
                            style={{
                                position: "sticky",
                                top: 0,
                                zIndex: 2,
                                background: "rgba(119, 159, 228, 0.53)",
                            }}
                        >
                        <tr>
                            <th style={{ width: 60 }}>T/R</th>
                            <th>Kim tomonidan</th>
                            <th>Taʼzir nomi</th>
                            <th>Sana</th>
                            <th>Yechilgan</th>
                            <th>Yechilgan sana</th>
                            {canAdd && <th className="amal" style={{ width: 120 }}>Amallar</th>}
                        </tr>
                        </thead>
                        <tbody>
                        {punishments.length === 0 ? (
                            <tr>
                                <td colSpan={canAdd ? 7 : 6} style={{ color: "#6b7280", fontStyle: "italic" }}>
                                    Maʼlumot mavjud emas
                                </td>
                            </tr>
                        ) : (
                            punishments.map((p, i) => {
                                const rowActions = canAdd && canEditRow(p.created_by as any);
                                const showMore = p.punishment_name && p.punishment_name.length > 40;
                                const expandedNow = isExpanded("punishments", p.id);
                                return (
                                    <tr key={p.id}>
                                        <td>{i + 1}</td>
                                        <td>{p.who_punished}</td>
                                        <td>
                                            {expandedNow ? (
                                                <>
                                                    {p.punishment_name}
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpanded(null)}
                                                        style={{
                                                            marginLeft: 8,
                                                            background: "transparent",
                                                            border: "none",
                                                            color: "#1b4f72",
                                                            textDecoration: "underline",
                                                            cursor: "pointer",
                                                            fontSize: 12,
                                                        }}
                                                    >
                                                        Yopish
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    {truncate(p.punishment_name, 40)}
                                                    {showMore && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpand("punishments", p.id)}
                                                            style={{
                                                                marginLeft: 8,
                                                                background: "transparent",
                                                                border: "none",
                                                                color: "#1b4f72",
                                                                textDecoration: "underline",
                                                                cursor: "pointer",
                                                                fontSize: 12,
                                                            }}
                                                        >
                                                            Batafsil
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                        <td>{p.punishment_date}</td>
                                        <td style={{ paddingLeft: 30 }}>
                                            {p.is_finished ? (
                                                <FaCheckCircle style={{ color: "#16a34a", fontSize: 22 }} />
                                            ) : (
                                                <MdCancel style={{ color: "#ef4444", fontSize: 22 }} />
                                            )}
                                        </td>
                                        <td>{p.is_finished ? p.finished_date || "" : "-"}</td>
                                        {canAdd && (
                                            <td className="actions">
                                                {rowActions ? (
                                                    <div className="actions-inner">
                                                        <button className="btn edit" title="Tahrirlash" onClick={() => openEditPunish(p)}>
                                                            <FaEdit />
                                                        </button>
                                                        <button className="btn delete" title="O‘chirish" onClick={() => askDeletePunish(p.id)}>
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
                        </tbody>
                    </table>
                </div>
            )}

            <AwardModal
                isOpen={awardOpen}
                onClose={() => setAwardOpen(false)}
                onSubmit={handleAwardSubmit}
                initialData={
                    editAward
                        ? {
                            id: editAward.id,
                            biografic_data: editAward.biografic_data,
                            awarded_by: editAward.awarded_by,
                            command_number: editAward.command_number,
                            awarded_date: editAward.awarded_date,
                            award_name: editAward.award_name,
                        }
                        : {
                            biografic_data: bioId,
                            awarded_by: "",
                            command_number: "",
                            awarded_date: "",
                            award_name: "",
                        }
                }
            />

            <PunishModal
                isOpen={punishOpen}
                onClose={() => setPunishOpen(false)}
                onSubmit={handlePunishSubmit}
                initialData={
                    editPunish
                        ? {
                            id: editPunish.id,
                            biografic_data: editPunish.biografic_data,
                            who_punished: editPunish.who_punished,
                            punishment_name: editPunish.punishment_name,
                            punishment_date: editPunish.punishment_date,
                            finished_date: editPunish.finished_date ?? "",
                            is_finished: editPunish.is_finished,
                        }
                        : {
                            biografic_data: bioId,
                            who_punished: "",
                            punishment_name: "",
                            punishment_date: "",
                            finished_date: "",
                            is_finished: false,
                        }
                }
            />

            <ConfirmModal
                isOpen={confirmOpen}
                text="Ushbu yozuvni o‘chirmoqchimisiz?"
                onCancel={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
            />
        </div>
    );
};

export default StatePage;
