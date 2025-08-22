// src/pages/BioShtat/BioModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import { FaUserCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import bioShtatService, { type BioGroup, type BioPerson } from "../../../services/bioShtatService";
import techBaseService, { PartOfDepartment } from "../../../services/texBaseService";
import RankLazySelect, { Option as RankOpt } from "../../../components/AsyncSelects/RankLazySelect";
import PositionLazySelect, { Option as PositionOpt } from "../../../components/AsyncSelects/PositionLazySelect";
import "./BioShtatModal.scss";
import "../Modal.scss";

type PartOpt = { value: number; label: string };

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSaved: (p: BioPerson) => void;
    groups: BioGroup[];
    defaultGroupId?: number | null;
    person?: BioPerson | null;
    isSuper?: boolean;
};

const selectStyles: StylesConfig<PartOpt, false> = {
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
    valueContainer: (base) => ({ ...base, padding: "0 12px" }),
    input: (base) => ({ ...base, margin: 0, padding: 0 }),
    indicatorsContainer: (base) => ({ ...base, height: 40 }),
    indicatorSeparator: () => ({ display: "none" }),
    placeholder: (base) => ({ ...base, color: "#9ca3af" }),
    singleValue: (base) => ({ ...base, color: "#111827" }),
    menu: (base) => ({ ...base, borderRadius: 8, overflow: "hidden" }),
    menuPortal: (base) => ({ ...base, zIndex: 3002 }),
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

const BioModal: React.FC<Props> = ({
                                       isOpen,
                                       onClose,
                                       onSaved,
                                       groups,
                                       defaultGroupId = null,
                                       person = null,
                                       isSuper = false,
                                   }) => {
    const isEdit = !!person;

    const [saving, setSaving] = useState(false);

    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string>("");

    const [parts, setParts] = useState<PartOpt[]>([]);
    const [partOpt, setPartOpt] = useState<PartOpt | null>(null);

    const [rankOpt, setRankOpt] = useState<RankOpt | null>(null);
    const [positionOpt, setPositionOpt] = useState<PositionOpt | null>(null);

    const [fullName, setFullName] = useState<string>("");
    const [positionDate, setPositionDate] = useState<string>("");
    const [qualification, setQualification] = useState<string>("");
    const [endedCourses, setEndedCourses] = useState<string>("");
    const [beenInAbroad, setBeenInAbroad] = useState<string>("");
    const [bornPlace, setBornPlace] = useState<string>("");
    const [bornDate, setBornDate] = useState<string>("");
    const [nationality, setNationality] = useState<string>("");
    const [livePlace, setLivePlace] = useState<string>("");
    const [phoneNumber, setPhoneNumber] = useState<string>("");
    const [height, setHeight] = useState<string>("");
    const [weight, setWeight] = useState<string>("");
    const [childCount, setChildCount] = useState<string>("");

    const fileRef = useRef<HTMLInputElement | null>(null);

    const groupFallbackOpt = useMemo<PartOpt | null>(() => {
        const g = groups.find((x) => x.id === defaultGroupId) || groups[0];
        return g ? { value: g.id, label: `${g.name} • ${g.department}` } : null;
    }, [groups, defaultGroupId]);

    useEffect(() => {
        const url = photoFile ? URL.createObjectURL(photoFile) : "";
        setPhotoPreview(url);
        return () => {
            if (url) URL.revokeObjectURL(url);
        };
    }, [photoFile]);

    useEffect(() => {
        if (!isOpen) return;

        setSaving(false);
        setPhotoFile(null);

        if (isSuper) {
            (async () => {
                try {
                    const list = await techBaseService.getPartOfDepartments();
                    const opts: PartOpt[] = list.map((p: PartOfDepartment) => ({
                        value: p.id,
                        label: p.department ? `${p.name} — ${p.department}` : p.name,
                    }));
                    setParts(opts);
                    setPartOpt(groupFallbackOpt);
                } catch {
                    setParts([]);
                    setPartOpt(groupFallbackOpt);
                }
            })();
        } else {
            setParts([]);
            setPartOpt(null);
        }

        setFullName(person?.full_name ?? "");
        setPositionDate(person?.position_date ?? "");
        setQualification((person as any)?.qualfication ?? "");
        setEndedCourses(person?.ended_courses ?? "");
        setBeenInAbroad(person?.been_in_abroad ?? "");
        setBornPlace(person?.born_place ?? "");
        setBornDate(person?.born_date ?? "");
        setNationality(person?.nationality ?? "");
        setLivePlace(person?.live_place ?? "");
        setPhoneNumber(person?.phone_number ?? "");
        setHeight(person?.height == null ? "" : String(person?.height));
        setWeight(person?.weight == null ? "" : String(person?.weight));
        setChildCount(person?.child_count == null ? "" : String(person?.child_count));

        setRankOpt(person?.rank ? { value: "", label: person.rank } : null);
        setPositionOpt(person?.position ? { value: "", label: person.position } : null);
    }, [isOpen, isSuper, person, groupFallbackOpt]);

    const handlePickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] ?? null;
        setPhotoFile(f);
    };

    const hasPhoto = Boolean(photoFile || person?.photo);
    const hasRank = Boolean(rankOpt?.value || person?.rank);
    const hasPosition = Boolean(positionOpt?.value || person?.position);
    const hasPart = !isSuper || Boolean(partOpt?.value);
    const allTextFilled =
        fullName.trim() !== "" &&
        positionDate.trim() !== "" &&
        qualification.trim() !== "" &&
        endedCourses.trim() !== "" &&
        beenInAbroad.trim() !== "" &&
        bornPlace.trim() !== "" &&
        bornDate.trim() !== "" &&
        nationality.trim() !== "" &&
        livePlace.trim() !== "" &&
        phoneNumber.trim() !== "" &&
        height.trim() !== "" &&
        weight.trim() !== "" &&
        childCount.trim() !== "";
    const canSubmit = hasPhoto && hasRank && hasPosition && hasPart && allTextFilled;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        const payload: any = {
            full_name: fullName,
            position_date: positionDate,
            qualfication: qualification,
            ended_courses: endedCourses,
            been_in_abroad: beenInAbroad,
            born_place: bornPlace,
            born_date: bornDate,
            nationality: nationality,
            live_place: livePlace,
            phone_number: phoneNumber,
            height: Number(height),
            weight: Number(weight),
            child_count: Number(childCount),
        };

        if (isSuper && partOpt?.value) payload.part_of_department = partOpt.value;
        if (rankOpt?.value) payload.rank = Number(rankOpt.value);
        if (positionOpt?.value) payload.position = Number(positionOpt.value);
        if (photoFile) payload.photo = photoFile;

        try {
            setSaving(true);
            const saved =
                isEdit && person ? await bioShtatService.update(person.id, payload) : await bioShtatService.create(payload);
            onSaved(saved);
            onClose();
            toast.success(isEdit ? "Maʼlumot yangilandi" : "Maʼlumot qoʻshildi");
        } catch (e: any) {
            extractApiErrors(e).forEach((m, i) => toast.error(m, { toastId: `bio-save-${i}-${m}` }));
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const previewSrc = photoPreview || person?.photo || "";

    return (
        <div className="bioshtat-modal-overlay" onMouseDown={(ev) => ev.target === ev.currentTarget && onClose()}>
            <div className="bioshtat-modal" role="dialog" aria-modal="true">
                <div className="bioshtat-modal-body">
                    <h3 className="bioshtat-name">{isEdit ? "Xodimni tahrirlash" : "Yangi xodim"}</h3>

                    <div className="bioshtat-form-photo" onClick={() => fileRef.current?.click()} title="Rasm tanlash">
                        <div className="bioshtat-avatar-wrap">
                            {previewSrc ? (
                                <img src={previewSrc} alt={fullName || "photo"} className="bioshtat-avatar-img" />
                            ) : (
                                <FaUserCircle className="bioshtat-avatar-icon" />
                            )}
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" onChange={handlePickPhoto} style={{ display: "none" }} />
                    </div>

                    <form className="bioshtat-form" onSubmit={handleSubmit}>
                        {isSuper && (
                            <div className="bioshtat-form-row">
                                <label>Bo‘linma</label>
                                <Select<PartOpt, false>
                                    classNamePrefix="react-select"
                                    styles={selectStyles}
                                    options={parts}
                                    value={partOpt}
                                    onChange={(opt: SingleValue<PartOpt>) => setPartOpt(opt ?? null)}
                                    placeholder="Bo‘linmani tanlang"
                                    isClearable
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                />
                            </div>
                        )}

                        <div className="bioshtat-form-grid-3">
                            <label>
                                F.I.Sh.
                                <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                            </label>

                            <label>
                                Unvoni
                                <RankLazySelect value={rankOpt} onChange={setRankOpt} placeholder="Unvon tanlang" />
                            </label>

                            <label>
                                Lavozimi
                                <PositionLazySelect value={positionOpt} onChange={setPositionOpt} placeholder="Lavozim tanlang" />
                            </label>

                            <label>
                                Lavozim sanasi
                                <input type="date" value={positionDate} onChange={(e) => setPositionDate(e.target.value)} required />
                            </label>

                            <label>
                                Malakasi
                                <input value={qualification} onChange={(e) => setQualification(e.target.value)} required />
                            </label>

                            <label>
                                O‘qigan kurslari
                                <input value={endedCourses} onChange={(e) => setEndedCourses(e.target.value)} required />
                            </label>

                            <label>
                                Chetda bo‘lganmi
                                <input value={beenInAbroad} onChange={(e) => setBeenInAbroad(e.target.value)} required />
                            </label>

                            <label>
                                Tug‘ilgan joy
                                <input value={bornPlace} onChange={(e) => setBornPlace(e.target.value)} required />
                            </label>

                            <label>
                                Tug‘ilgan sana
                                <input type="date" value={bornDate} onChange={(e) => setBornDate(e.target.value)} required />
                            </label>

                            <label>
                                Millati
                                <input value={nationality} onChange={(e) => setNationality(e.target.value)} required />
                            </label>

                            <label>
                                Manzili
                                <input value={livePlace} onChange={(e) => setLivePlace(e.target.value)} required />
                            </label>

                            <label>
                                Telefon
                                <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                            </label>

                            <label>
                                Bo‘yi (sm)
                                <input type="number" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} required />
                            </label>

                            <label>
                                Vazni (kg)
                                <input type="number" inputMode="numeric" value={weight} onChange={(e) => setWeight(e.target.value)} required />
                            </label>

                            <label>
                                Bola soni
                                <input type="number" inputMode="numeric" value={childCount} onChange={(e) => setChildCount(e.target.value)} required />
                            </label>
                        </div>

                        <div className="bioshtat-actions">
                            <button
                                type="submit"
                                className="bioshtat-btn-submit"
                                disabled={saving || !canSubmit}
                                title={saving || canSubmit ? "" : "Barcha maydonlarni to‘ldiring!"}
                            >
                                {isEdit ? "Saqlash" : "Qo‘shish"}
                            </button>
                            <button type="button" className="bioshtat-btn-cancel" onClick={onClose} disabled={saving}>
                                Bekor qilish
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BioModal;
