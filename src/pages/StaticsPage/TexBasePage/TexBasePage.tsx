import React, { useEffect, useMemo, useRef, useState } from "react";
import { IoMdAddCircle } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";
import { BsImages } from "react-icons/bs";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import techBaseService, { TechItem, Unit } from "../../../services/texBaseService";
import userService, { type CurrentUser } from "../../../services/userService";
import unitService from "../../../services/unitService";

import Loader from "../../../components/UI/Loader";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import TechBaseModal, { TechBaseInitial } from "../../../components/Modals/TexBase/TexBaseModal";

import "../../../style/global.scss";
import "./TexBasePage.scss";

const TOAST = {
    LOAD_ERR: "techbase-load-error",
    ACTION_ERR: "techbase-action-error",
    OK: "techbase-ok",
};

function extractApiErrors(err: any): string[] {
    const msgs: string[] = [];
    const data = err?.response?.data;
    const walk = (v: any) => {
        if (v == null) return;
        if (typeof v === "string") msgs.push(v);
        else if (Array.isArray(v)) v.forEach(walk);
        else if (typeof v === "object") {
            ["error", "errors", "non_field_errors"].forEach((k) => {
                if (k in v) walk((v as any)[k]);
            });
        }
    };
    if (data) walk(data);
    if (!msgs.length) msgs.push("Xatolik yuz berdi.");
    return Array.from(new Set(msgs.map((s) => s.trim()).filter(Boolean))).slice(0, 5);
}

const TechBasePage: React.FC = () => {
    const [me, setMe] = useState<CurrentUser | null>(null);
    const [roleReady, setRoleReady] = useState(false);

    const [units, setUnits] = useState<Unit[]>([]);
    const [activeUnitId, setActiveUnitId] = useState<number | null>(null);

    const [items, setItems] = useState<TechItem[]>([]);
    const [loading, setLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState<TechBaseInitial | undefined>(undefined);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Gallery modal
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const overlayRef = useRef<HTMLDivElement | null>(null);

    const isSuper = me?.role === "superadmin";
    const isAdmin = me?.role === "admin";
    const isUser = me?.role === "user";

    const [subTab, setSubTab] = useState<"dept" | "subs">("dept");

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
        if (!roleReady) return;
        if (!isSuper) {
            setUnits([]);
            setActiveUnitId(null);
            return;
        }
        (async () => {
            try {
                const list = await unitService.getAllUnits();
                setUnits(list);
                if (list.length && activeUnitId == null) setActiveUnitId(list[0].id);
            } catch (e: any) {
                extractApiErrors(e).forEach((m, i) =>
                    toast.error(m, { toastId: `${TOAST.LOAD_ERR}-${i}-${m}` })
                );
                setUnits([]);
            }
        })();
    }, [roleReady, isSuper]);

    const loadItems = async () => {
        if (!roleReady) return;
        try {
            setLoading(true);
            const data = isSuper
                ? activeUnitId == null
                    ? []
                    : await techBaseService.listByUnit(activeUnitId)
                : await techBaseService.listMine();
            setItems(Array.isArray(data) ? data : []);
        } catch (e: any) {
            extractApiErrors(e).forEach((m, i) =>
                toast.error(m, { toastId: `${TOAST.LOAD_ERR}-${i}-${m}` })
            );
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, [roleReady, isSuper, activeUnitId]);

    const openCreate = () => {
        setEditData(undefined);
        setIsModalOpen(true);
    };

    const openEdit = (row: TechItem) => {
        const init: TechBaseInitial = {
            id: row.id,
            part_of_department_id: undefined,
            part_of_department: (row as any).part_of_department,
            equipment_room: (row as any).equipment_room,
            count_pc_jcats: (row as any).count_pc_jcats,
            configuration: (row as any).configuration,
            invitation_solve_problems: (row as any).invitation_solve_problems,
            count_person: (row as any).count_person,
            photo_reports: (row as any).photo_reports ?? [],
        };
        setEditData(init);
        setIsModalOpen(true);
    };

    const handleSubmit = async (fd: FormData, id?: number) => {
        try {
            if (id) {
                await techBaseService.update(id, fd);
                toast.success("Ma`lumot yangilandi!", { toastId: `${TOAST.OK}-upd` });
            } else {
                await techBaseService.create(fd);
                toast.success("Ma`lumot saqlandi!", { toastId: `${TOAST.OK}-add` });
            }
            await loadItems();
        } catch (e: any) {
            extractApiErrors(e).forEach((m, i) =>
                toast.error(m, { toastId: `${TOAST.ACTION_ERR}-${i}-${m}` })
            );
        }
    };

    const handleDelete = async () => {
        if (deleteId == null) return;
        try {
            await techBaseService.remove(deleteId);
            toast.success("Ma`lumot o`chirildi!", { toastId: `${TOAST.OK}-del` });
            setIsDeleteOpen(false);
            setDeleteId(null);
            await loadItems();
        } catch (e: any) {
            extractApiErrors(e).forEach((m, i) =>
                toast.error(m, { toastId: `${TOAST.ACTION_ERR}-${i}-${m}` })
            );
        }
    };

    const toLower = (x: any) => String(x ?? "").toLowerCase();
    const isStrategic = (t: any) => toLower(t).startsWith("strateg");
    const isOperative = (t: any) => toLower(t).startsWith("operativ");

    const adminDeptItems = useMemo(
        () => items.filter((r: any) => isOperative(r.type)),
        [items]
    );
    const adminSubsItems = useMemo(
        () => items.filter((r: any) => !isOperative(r.type)),
        [items]
    );

    const deptName = useMemo(() => {
        const op: any = adminDeptItems[0] ?? items[0];
        return op?.department || "Boshqarma";
    }, [items, adminDeptItems]);

    const displayItems: TechItem[] = useMemo(() => {
        if (isAdmin) return subTab === "dept" ? adminDeptItems : adminSubsItems;
        return items;
    }, [isAdmin, subTab, adminDeptItems, adminSubsItems, items]);

    const superHasStrategic = useMemo(
        () => isSuper && items.some((r: any) => isStrategic(r.type)),
        [isSuper, items]
    );
    const showActionsColumn = isUser || (isAdmin && subTab === "dept") || (isSuper && superHasStrategic);

    const extractPhotoUrls = (row: TechItem): string[] => {
        const pr = (row as any).photo_reports;
        if (!Array.isArray(pr)) return [];
        return pr
            .map((x: any) => (typeof x === "string" ? x : x?.report_thumbnail))
            .filter(Boolean)
            .map(String);
    };

    const openGallery = (row: TechItem) => {
        const urls = extractPhotoUrls(row);
        if (!urls.length) {
            toast.error("Rasm topilmadi.", { toastId: `${TOAST.LOAD_ERR}-noimg` });
            return;
        }
        setGalleryImages(urls);
        setGalleryIndex(0);
        setGalleryOpen(true);
        setTimeout(() => overlayRef.current?.focus(), 0);
    };

    const closeGallery = () => setGalleryOpen(false);

    return (
        <div className="techbase-page">
            <div className="header">
                <h2 className="title">Instrumental texnologik baza</h2>
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
                    <button
                        className={`tab ${subTab === "dept" ? "active" : ""}`}
                        onClick={() => setSubTab("dept")}
                        title={deptName}
                    >
                        {deptName}
                    </button>
                    <button
                        className={`tab ${subTab === "subs" ? "active" : ""}`}
                        onClick={() => setSubTab("subs")}
                    >
                        Bo‘linmalari
                    </button>
                </div>
            )}

            {loading ? (
                <Loader />
            ) : displayItems.length === 0 ? (
                <div className="empty-state" style={{ minHeight: "48vh", display: "grid", placeItems: "center" }}>
                    <div className="empty-text">Maʼlumot mavjud emas!</div>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                        <tr>
                            <th>T/R</th>
                            <th>Bo‘linma</th>
                            {"equipment_room" in (displayItems[0] as any) && <th>Jihoz xonasi</th>}
                            <th>JCATS kompyuterlar</th>
                            <th>Konfiguratsiya</th>
                            <th>Muammolarni hal etish</th>
                            <th>Xodimlar soni</th>
                            <th>Foto</th>
                            {showActionsColumn && <th className="amal">Amallar</th>}
                        </tr>
                        </thead>
                        <tbody>
                        {displayItems.map((row: any, idx) => {
                            const canRowActions = isUser || (isSuper && isStrategic(row.type)) || (isAdmin && subTab === "dept");

                            const pr = (row as any).photo_reports;
                            const photosN = Array.isArray(pr)
                                ? pr.filter((x: any) => x && (typeof x === "string" || x.report_thumbnail)).length
                                : 0;

                            return (
                                <tr key={row.id}>
                                    <td>{idx + 1}</td>
                                    <td>{row.part_of_department}</td>
                                    {"equipment_room" in row && <td>{row.equipment_room ?? "—"}</td>}
                                    <td>{row.count_pc_jcats}</td>
                                    <td>{row.configuration}</td>
                                    <td>{row.invitation_solve_problems}</td>
                                    <td>{row.count_person}</td>
                                    <td className="photos-cell">
                                        <button
                                            className="btn gallery"
                                            title={photosN ? `${photosN} ta rasm` : "Rasmlar"}
                                            onClick={() => openGallery(row)}
                                        >
                                            <BsImages size={18} />
                                        </button>
                                    </td>

                                    {showActionsColumn && (
                                        <td className="actions">
                                            {canRowActions ? (
                                                <div className="actions-inner">
                                                    <button className="btn edit" title="Tahrirlash" onClick={() => openEdit(row)}>
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        className="btn delete"
                                                        title="O‘chirish"
                                                        onClick={() => {
                                                            setDeleteId(row.id);
                                                            setIsDeleteOpen(true);
                                                        }}
                                                    >
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
                        })}
                        </tbody>
                    </table>
                </div>
            )}

            <TechBaseModal
                isOpen={isModalOpen}
                isSuper={isSuper}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={editData}
            />

            <ConfirmModal
                isOpen={isDeleteOpen}
                text="Ushbu yozuvni o‘chirmoqchimisiz?"
                onCancel={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
            />

            {galleryOpen && (
                <div
                    ref={overlayRef}
                    className="img-modal-overlay"
                    tabIndex={-1}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") setGalleryOpen(false);
                        else if (e.key === "ArrowRight")
                            setGalleryIndex((i) => (i + 1) % galleryImages.length);
                        else if (e.key === "ArrowLeft")
                            setGalleryIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
                    }}
                    onMouseDown={(e) => e.target === e.currentTarget && setGalleryOpen(false)}
                >
                    <div className="img-modal">
                        <img src={galleryImages[galleryIndex]} alt={`photo-${galleryIndex + 1}`} />
                        <button className="img-close" onClick={() => setGalleryOpen(false)} aria-label="Yopish">
                            ×
                        </button>
                        {galleryImages.length > 1 && (
                            <>
                                <button
                                    className="img-nav prev"
                                    onClick={() =>
                                        setGalleryIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length)
                                    }
                                    aria-label="Oldingi"
                                >
                                    ‹
                                </button>
                                <button
                                    className="img-nav next"
                                    onClick={() => setGalleryIndex((i) => (i + 1) % galleryImages.length)}
                                    aria-label="Keyingi"
                                >
                                    ›
                                </button>
                                <div className="img-counter">
                                    {galleryIndex + 1} / {galleryImages.length}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TechBasePage;
