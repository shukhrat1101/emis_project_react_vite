// src/components/Modals/Saf/SafModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import { toast } from "react-toastify";
import "./SafModal.scss";
import safService, { type PartOfDepartment } from "../../../services/safService";

type PartOpt = { value: number; label: string };
type PersonOpt = { value: number; label: string };

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    isSuper?: boolean;
    defaultPartId?: number | null;
    defaultDate?: string;
};

const selectStyles: StylesConfig<any, false> = {
    control: (base, s) => ({
        ...base,
        minHeight: 40,
        height: 40,
        backgroundColor: "#fff",
        borderColor: s.isFocused ? "#395977" : "#d1d5db",
        boxShadow: s.isFocused ? "0 0 0 2px rgba(37,99,235,.15)" : "none",
        borderRadius: 8,
        ":hover": { borderColor: s.isFocused ? "#395977" : "#cbd5e1" },
    }),
    valueContainer: (b) => ({ ...b, padding: "0 12px" }),
    input: (b) => ({ ...b, margin: 0, padding: 0 }),
    indicatorsContainer: (b) => ({ ...b, height: 40 }),
    indicatorSeparator: () => ({ display: "none" }),
    placeholder: (b) => ({ ...b, color: "#9ca3af" }),
    singleValue: (b) => ({ ...b, color: "#111827" }),
    menu: (b) => ({ ...b, borderRadius: 8, overflow: "hidden" }),
    menuPortal: (b) => ({ ...b, zIndex: 3002 }),
};

function extractApiErrors(err: any): string[] {
    const out: string[] = [];
    const src = err?.response?.data;
    const walk = (v: any) => {
        if (v == null) return;
        if (typeof v === "string") out.push(v);
        else if (Array.isArray(v)) v.forEach(walk);
        else if (typeof v === "object") Object.values(v).forEach(walk);
    };
    if (src) walk(src);
    if (!out.length) out.push("Xatolik yuz berdi.");
    return Array.from(new Set(out.map((s) => s.trim()).filter(Boolean))).slice(0, 8);
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const SafModal: React.FC<Props> = ({
                                       isOpen,
                                       onClose,
                                       onSaved,
                                       isSuper = false,
                                       defaultPartId = null,
                                   }) => {
    const [saving, setSaving] = useState(false);

    const [parts, setParts] = useState<PartOpt[]>([]);
    const [partOpt, setPartOpt] = useState<PartOpt | null>(null);

    const [listOff, setListOff] = useState<string>("");
    const [listSer, setListSer] = useState<string>("");
    const [listEmp, setListEmp] = useState<string>("");

    const [absOff, setAbsOff] = useState<string>("0");
    const [absSer, setAbsSer] = useState<string>("0");
    const [absEmp, setAbsEmp] = useState<string>("0");

    const [peopleOpts, setPeopleOpts] = useState<PersonOpt[]>([]);
    const [reasons, setReasons] = useState<{ biografic_data: number | null; reason: string }[]>([]);

    const absTotal = useMemo(
        () => (Number(absOff) || 0) + (Number(absSer) || 0) + (Number(absEmp) || 0),
        [absOff, absSer, absEmp]
    );

    useEffect(() => {
        if (!isOpen) return;

        setSaving(false);
        setListOff("");
        setListSer("");
        setListEmp("");
        setAbsOff("0");
        setAbsSer("0");
        setAbsEmp("0");
        setReasons([]);

        (async () => {
            try {
                const bios = await safService.bioSelect();
                const opts: PersonOpt[] = Array.isArray(bios)
                    ? bios.map((x) => ({ value: x.id, label: `${x.rank ?? ""} ${x.full_name}`.trim() }))
                    : [];
                setPeopleOpts(opts);
            } catch {
                setPeopleOpts([]);
            }
        })();

        if (isSuper) {
            (async () => {
                try {
                    const list = await safService.getPartOfDepartments();
                    const opts: PartOpt[] = list.map((p: PartOfDepartment) => ({
                        value: p.id,
                        label: p.department ? `${p.name} — ${p.department}` : p.name,
                    }));
                    setParts(opts);
                    const def = defaultPartId ? opts.find((o) => o.value === defaultPartId) || null : null;
                    setPartOpt(def);
                } catch {
                    setParts([]);
                    setPartOpt(null);
                }
            })();
        } else {
            setParts([]);
            setPartOpt(defaultPartId ? { value: defaultPartId, label: "" } : null);
        }
    }, [isOpen, isSuper, defaultPartId]);

    useEffect(() => {
        if (!isOpen) return;
        setReasons((prev) => {
            const next = [...prev];
            if (absTotal > next.length) {
                const need = absTotal - next.length;
                for (let i = 0; i < need; i++) next.push({ biografic_data: null, reason: "" });
            } else if (absTotal < next.length) {
                next.length = absTotal;
            }
            return next;
        });
    }, [absTotal, isOpen]);

    const canSubmit =
        (!isSuper || !!partOpt?.value) &&
        listOff.trim() !== "" &&
        listSer.trim() !== "" &&
        listEmp.trim() !== "" &&
        reasons.every((r) => (absTotal === 0 ? true : Boolean(r.biografic_data && r.reason.trim() !== "")));

    const handleReasonSelect = (idx: number, opt: SingleValue<PersonOpt>) => {
        setReasons((arr) => {
            const a = [...arr];
            a[idx] = { ...a[idx], biografic_data: opt ? opt.value : null };
            return a;
        });
    };

    const handleReasonText = (idx: number, val: string) => {
        setReasons((arr) => {
            const a = [...arr];
            a[idx] = { ...a[idx], reason: val };
            return a;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        const payload: any = {
            date: todayISO(),
            ...(isSuper && partOpt?.value ? { part_of_department: partOpt.value } : {}),
            list_off_count: Number(listOff) || 0,
            list_ser_count: Number(listSer) || 0,
            list_employee_count: Number(listEmp) || 0,
            temporary_absents: {
                off_count: Number(absOff) || 0,
                ser_count: Number(absSer) || 0,
                employee_count: Number(absEmp) || 0,
                reasons:
                    absTotal > 0
                        ? reasons.map((r) => ({
                            biografic_data: r.biografic_data,
                            reason: r.reason.trim(),
                        }))
                        : [],
            },
        };

        try {
            setSaving(true);
            await safService.create(payload);
            toast.success("Qaydnoma qo‘shildi");
            onSaved();
            onClose();
        } catch (e: any) {
            extractApiErrors(e).forEach((m, i) => toast.error(m, { toastId: `saf-create-${i}-${m}` }));
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="safm-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="safm-modal" role="dialog" aria-modal="true">
                <div className="safm-body">
                    <h3 className="safm-title">SAF qaydnoma — qo‘shish</h3>

                    <form className="safm-form" onSubmit={handleSubmit}>
                        {isSuper && (
                            <div className="safm-row">
                                <label className="safm-full">
                                    Bo‘linma
                                    <Select<PartOpt, false>
                                        classNamePrefix="react-select"
                                        styles={selectStyles}
                                        options={parts}
                                        value={partOpt}
                                        onChange={(opt) => setPartOpt((opt as PartOpt) ?? null)}
                                        placeholder="Bo‘linmani tanlang"
                                        isClearable
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                    />
                                </label>
                            </div>
                        )}

                        <div className="safm-section-title">Ro‘yxat bo‘yicha</div>
                        <div className="safm-grid-3">
                            <label>
                                Offitser
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    value={listOff}
                                    onChange={(e) => setListOff(e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                Serjant
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    value={listSer}
                                    onChange={(e) => setListSer(e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                Xodim
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    value={listEmp}
                                    onChange={(e) => setListEmp(e.target.value)}
                                    required
                                />
                            </label>
                        </div>

                        <div className="safm-section-title">Vaqtincha safda yo‘q</div>
                        <div className="safm-grid-3">
                            <label>
                                Offitser
                                <input type="number" inputMode="numeric" value={absOff} onChange={(e) => setAbsOff(e.target.value)} />
                            </label>
                            <label>
                                Serjant
                                <input type="number" inputMode="numeric" value={absSer} onChange={(e) => setAbsSer(e.target.value)} />
                            </label>
                            <label>
                                Xodim
                                <input type="number" inputMode="numeric" value={absEmp} onChange={(e) => setAbsEmp(e.target.value)} />
                            </label>
                        </div>

                        {absTotal > 0 && (
                            <div className="safm-reasons">
                                <div className="safm-reasons-head">Yo‘qlar ro‘yxati ({absTotal} ta)</div>
                                {reasons.map((r, idx) => (
                                    <div key={idx} className="safm-reason-row">
                                        <div className="left">
                                            <Select<PersonOpt, false>
                                                classNamePrefix="react-select"
                                                styles={selectStyles}
                                                options={peopleOpts}
                                                value={peopleOpts.find((o) => o.value === r.biografic_data) || null}
                                                onChange={(opt) => handleReasonSelect(idx, opt)}
                                                placeholder={`${idx + 1}-xodim`}
                                                menuPortalTarget={document.body}
                                                menuPosition="fixed"
                                            />
                                        </div>
                                        <div className="right">
                                            <input
                                                placeholder="Sabab"
                                                value={r.reason}
                                                onChange={(e) => handleReasonText(idx, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="safm-actions">
                            <button type="submit" className="safm-btn-submit" disabled={saving || !canSubmit}>
                                Qo‘shish
                            </button>
                            <button type="button" className="safm-btn-cancel" onClick={onClose} disabled={saving}>
                                Bekor qilish
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SafModal;
