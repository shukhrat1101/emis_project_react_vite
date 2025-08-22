import React, { useEffect, useMemo, useState } from "react";
import { IoMdAddCircle } from "react-icons/io";
import { FaTrashCan } from "react-icons/fa6";
import { toast } from "react-toastify";
import userService, { type CurrentUser } from "../../../services/userService";
import unitService from "../../../services/unitService";
import safService, { type SafItem } from "../../../services/safService";
import "./SafPage.scss";
import SafqDateFilter from "../../../components/UI/Filter/SafDateFilter";
import SafModal from "../../../components/Modals/Saf/SafModal";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import Loader from "../../../components/UI/Loader";

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

const todayISO = () => new Date().toISOString().slice(0, 10);

const SafPage: React.FC = () => {
    const [me, setMe] = useState<CurrentUser | null>(null);
    const [isSuper, setIsSuper] = useState(false);

    const [units, setUnits] = useState<Unit[]>([]);
    const [activeDeptId, setActiveDeptId] = useState<number | null>(null);

    const [date, setDate] = useState<string>(todayISO());
    const [loading, setLoading] = useState(false);

    const [rows, setRows] = useState<SafItem[]>([]);

    const [absModalOpen, setAbsModalOpen] = useState(false);
    const [absModalTitle, setAbsModalTitle] = useState("");
    const [absModalItems, setAbsModalItems] = useState<{ id: number; full_name: string; reason: string }[]>([]);

    const [createOpen, setCreateOpen] = useState(false);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<SafItem | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const u = await userService.me();
                setMe(u);
                setIsSuper(u?.role === "superadmin");
            } catch {
                setMe(null);
                setIsSuper(false);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            if (!isSuper) return;
            try {
                const us = await unitService.getAllUnits();
                setUnits(us);
                if (us.length && activeDeptId == null) setActiveDeptId(us[0].id);
            } catch (e: any) {
                extractApiErrors(e).forEach((m, i) => toast.error(m, { toastId: `saf-units-${i}-${m}` }));
            }
        })();
    }, [isSuper]);

    const load = async () => {
        try {
            setLoading(true);
            if (isSuper) {
                if (!activeDeptId) setRows([]);
                else {
                    const res = await safService.listById(activeDeptId, { date });
                    setRows(res.results);
                }
            } else {
                const res = await safService.list({ date });
                setRows(res.results);
            }
        } catch (e: any) {
            extractApiErrors(e).forEach((m, i) => toast.error(m, { toastId: `saf-load-${i}-${m}` }));
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [isSuper, activeDeptId, date]);

    const showActionsColumn = useMemo(() => rows.some((r) => r.created_by?.id === me?.id), [rows, me?.id]);
    const showTotalsRow = me?.role !== "user";

    const totals = useMemo(() => {
        const s = {
            shtatOff: 0,
            shtatSer: 0,
            shtatEmp: 0,
            shtatAll: 0,
            royxOff: 0,
            royxSer: 0,
            royxEmp: 0,
            royxAll: 0,
            safdaOff: 0,
            safdaSer: 0,
            safdaEmp: 0,
            safdaAll: 0,
            yoqOff: 0,
            yoqSer: 0,
            yoqEmp: 0,
            yoqAll: 0,
            vakOff: 0,
            vakSer: 0,
            vakEmp: 0,
            vakAll: 0,
        };
        for (const r of rows) {
            const sht: { off_count: number; ser_count: number; emp_count: number } =
                (r.part_of_department as any)?.shtat || { off_count: 0, ser_count: 0, emp_count: 0 };
            const abs = r.absents ?? { id: 0, off_count: 0, ser_count: 0, employee_count: 0, total: 0, reasons: [] };
            const vac = r.vacancies ?? { id: 0, off_count: 0, ser_count: 0, employee_count: 0, total: 0 };

            s.shtatOff += sht.off_count;
            s.shtatSer += sht.ser_count;
            s.shtatEmp += sht.emp_count;
            s.shtatAll += sht.off_count + sht.ser_count + sht.emp_count;

            s.royxOff += r.list_off_count;
            s.royxSer += r.list_ser_count;
            s.royxEmp += r.list_employee_count;
            s.royxAll += r.list_total;

            s.safdaOff += r.inline_off_count;
            s.safdaSer += r.inline_ser_count;
            s.safdaEmp += r.inline_employee_count;
            s.safdaAll += r.inline_total;

            s.yoqOff += abs.off_count;
            s.yoqSer += abs.ser_count;
            s.yoqEmp += abs.employee_count;
            s.yoqAll += abs.total;

            s.vakOff += vac.off_count;
            s.vakSer += vac.ser_count;
            s.vakEmp += vac.employee_count;
            s.vakAll += vac.total;
        }
        return s;
    }, [rows]);

    const openAbsentsModal = (r: SafItem) => {
        const abs = r.absents ?? { id: 0, off_count: 0, ser_count: 0, employee_count: 0, total: 0, reasons: [] };
        if (!abs.total) return;
        setAbsModalTitle(`${r.part_of_department?.name || "-"} — yo‘qlar ro‘yxati`);
        setAbsModalItems(abs.reasons);
        setAbsModalOpen(true);
    };

    const askDelete = (r: SafItem) => {
        if (!me?.id || r.created_by?.id !== me.id) return;
        setDeleteTarget(r);
        setDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            setDeleteLoading(true);
            await safService.remove(deleteTarget.id);
            toast.success("Yozuv o‘chirildi");
            setDeleteOpen(false);
            setDeleteTarget(null);
            await load();
        } catch (e: any) {
            extractApiErrors(e).forEach((m, i) => toast.error(m, { toastId: `saf-del-${i}-${m}` }));
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="safq-page">
            <div className="safq-header">
                <h2 className="safq-title">{date} kuni uchun saf qaydnomasi</h2>
                <button className="add-btn" onClick={() => setCreateOpen(true)}>
                    <IoMdAddCircle /> Qo‘shish
                </button>
            </div>

            <div className="safq-filters">
                <SafqDateFilter value={date} onChange={(d) => setDate(d)} />
            </div>

            {isSuper && units.length > 0 && (
                <div className="safq-tabs">
                    {units.map((u) => (
                        <button
                            key={u.id}
                            className={`safq-tab ${activeDeptId === u.id ? "active" : ""}`}
                            onClick={() => setActiveDeptId(u.id)}
                            title={u.name}
                        >
                            {u.name}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="safq-empty-center"><Loader /></div>
            ) : rows.length === 0 ? (
                <div className="safq-empty-center">Maʼlumot mavjud emas</div>
            ) : (
                <div className="safq-table-wrapper">
                    <table className="safq-table">
                        <thead>
                        <tr className="safq-head-1">
                            <th rowSpan={2} className="left-stick">Bo‘linmalar nomlanishi</th>
                            <th colSpan={3}>Shtat bo‘yicha</th>
                            <th colSpan={3}>Ro‘yxat bo‘yicha</th>
                            <th colSpan={3}>Safda</th>
                            <th colSpan={3}>Vaqtincha safda yo‘q</th>
                            <th colSpan={3}>Vakant</th>
                            {showActionsColumn && <th rowSpan={2} className="right-stick">Amallar</th>}
                        </tr>
                        <tr className="safq-head-2">
                            <th>Off / Ser.</th><th>QK xiz.</th><th>Jami</th>
                            <th>Off / Ser.</th><th>QK xiz.</th><th>Jami</th>
                            <th>Off / Ser.</th><th>QK xiz.</th><th>Jami</th>
                            <th>Off / Ser.</th><th>QK xiz.</th><th>Jami</th>
                            <th>Off / Ser.</th><th>QK xiz.</th><th>Jami</th>
                        </tr>
                        </thead>
                        <tbody>
                        {rows.map((r) => {
                            const shtat: { off_count: number; ser_count: number; emp_count: number } =
                                (r.part_of_department as any)?.shtat || { off_count: 0, ser_count: 0, emp_count: 0 };
                            const vac = r.vacancies ?? { id: 0, off_count: 0, ser_count: 0, employee_count: 0, total: 0 };
                            const abs = r.absents ?? { id: 0, off_count: 0, ser_count: 0, employee_count: 0, total: 0, reasons: [] };

                            const canDelete = !!me?.id && r.created_by?.id === me.id;

                            return (
                                <tr key={r.id}>
                                    <td className="name-cell">{r.part_of_department?.name || "-"}</td>

                                    <td className="num">{shtat.off_count} / {shtat.ser_count}</td>
                                    <td className="num">{shtat.emp_count}</td>
                                    <td className="num">{shtat.off_count + shtat.ser_count + shtat.emp_count}</td>

                                    <td className="num">{r.list_off_count} / {r.list_ser_count}</td>
                                    <td className="num">{r.list_employee_count}</td>
                                    <td className="num">{r.list_total}</td>

                                    <td className="num">{r.inline_off_count} / {r.inline_ser_count}</td>
                                    <td className="num">{r.inline_employee_count}</td>
                                    <td className="num">{r.inline_total}</td>

                                    <td className={`num ${abs.total ? "safq-click" : ""}`} onClick={() => abs.total && openAbsentsModal(r)}>
                                        {abs.off_count} / {abs.ser_count}
                                    </td>
                                    <td className={`num ${abs.total ? "safq-click" : ""}`} onClick={() => abs.total && openAbsentsModal(r)}>
                                        {abs.employee_count}
                                    </td>
                                    <td className={`num ${abs.total ? "safq-click" : ""}`} onClick={() => abs.total && openAbsentsModal(r)}>
                                        {abs.total}
                                    </td>

                                    <td className="num">{vac.off_count} / {vac.ser_count}</td>
                                    <td className="num">{vac.employee_count}</td>
                                    <td className="num">{vac.total}</td>

                                    {showActionsColumn && (
                                        <td className="actions">
                                            {canDelete ? (
                                                <button className="btn delete" title="O‘chirish" onClick={() => askDelete(r)}>
                                                    <FaTrashCan />
                                                </button>
                                            ) : (
                                                <span className="safq-dash">—</span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}

                        {rows.length > 0 && showTotalsRow && (
                            <tr className="sum-row">
                                <td className="name-cell">JAMI:</td>
                                <td className="num">{totals.shtatOff} / {totals.shtatSer}</td>
                                <td className="num">{totals.shtatEmp}</td>
                                <td className="num">{totals.shtatAll}</td>
                                <td className="num">{totals.royxOff} / {totals.royxSer}</td>
                                <td className="num">{totals.royxEmp}</td>
                                <td className="num">{totals.royxAll}</td>
                                <td className="num">{totals.safdaOff} / {totals.safdaSer}</td>
                                <td className="num">{totals.safdaEmp}</td>
                                <td className="num">{totals.safdaAll}</td>
                                <td className="num">{totals.yoqOff} / {totals.yoqSer}</td>
                                <td className="num">{totals.yoqEmp}</td>
                                <td className="num">{totals.yoqAll}</td>
                                <td className="num">{totals.vakOff} / {totals.vakSer}</td>
                                <td className="num">{totals.vakEmp}</td>
                                <td className="num">{totals.vakAll}</td>
                                {showActionsColumn && <td />}
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            )}

            {absModalOpen && (
                <div className="safq-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setAbsModalOpen(false)}>
                    <div className="safq-modal" role="dialog" aria-modal="true">
                        <div className="safq-modal-header">
                            <h3 className="safq-modal-title">{absModalTitle}</h3>
                            <button className="safq-modal-close" onClick={() => setAbsModalOpen(false)}>✕</button>
                        </div>
                        <div className="safq-modal-body">
                            {absModalItems.length === 0 ? (
                                <div className="safq-empty-center">Maʼlumot mavjud emas</div>
                            ) : (
                                <ul className="safq-abs-list">
                                    {absModalItems.map((x) => (
                                        <li key={x.id}>
                                            <span className="nm">{x.full_name}</span>
                                            <span className="rs">{x.reason}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <SafModal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                isSuper={isSuper}
                defaultPartId={activeDeptId ?? null}
                defaultDate={date}
                onSaved={async () => {
                    setCreateOpen(false);
                    await load();
                }}
            />

            <ConfirmModal
                isOpen={deleteOpen}
                text="Ushbu yozuvni o‘chirmoqchimisiz?"
                onCancel={() => {
                    setDeleteOpen(false);
                    setDeleteTarget(null);
                }}
                onConfirm={confirmDelete}
            />
        </div>
    );
};

export default SafPage;
