// src/components/Modals/TechBase/TechBaseModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import { RiImageAddFill } from "react-icons/ri";
import { SiCcleaner } from "react-icons/si";
import "../Modal.scss";
import "./TechBaseModal.scss";
import techBaseService, { PartOfDepartment } from "../../../services/texBaseService";

type Option = { value: number; label: string };

export type TechBaseInitial = {
    id?: number;
    part_of_department_id?: number | null;
    part_of_department?: string | null;
    equipment_room?: number | string;
    count_pc_jcats?: number | string;
    configuration?: string;
    invitation_solve_problems?: string;
    count_person?: number | string;
    photo_reports?: { report_thumbnail?: string }[] | string[];
};

type Props = {
    isOpen: boolean;
    isSuper?: boolean;
    onClose: () => void;
    onSubmit: (fd: FormData, id?: number) => void | Promise<void>;
    initialData?: TechBaseInitial;
};

const selectStyles: StylesConfig<Option, false> = {
    control: (base, state) => ({
        ...base,
        minHeight: 40,
        height: 40,
        backgroundColor: "#fff",
        borderColor: state.isFocused ? "#395977" : "#d1d5db",
        boxShadow: state.isFocused ? "0 0 0 2px rgba(37,99,235,.15)" : "none",
        borderRadius: 8,
        ":hover": { borderColor: state.isFocused ? "#395977" : "#cbd5e1" },
    }),
    valueContainer: (base) => ({ ...base, padding: "0 12px" }),
    input: (base) => ({ ...base, margin: 0, padding: 0 }),
    indicatorsContainer: (base) => ({ ...base, height: 40 }),
    indicatorSeparator: () => ({ display: "none" }),
    placeholder: (base) => ({ ...base, color: "#9ca3af" }),
    singleValue: (base) => ({ ...base, color: "#111827" }),
    menu: (base) => ({ ...base, borderRadius: 8, overflow: "hidden", zIndex: 40 }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? "#395977" : state.isFocused ? "#eef2ff" : "#fff",
        color: state.isSelected ? "#fff" : "#111827",
    }),
};

const TechBaseModal: React.FC<Props> = ({ isOpen, isSuper = false, onClose, onSubmit, initialData }) => {
    const isEdit = Boolean(initialData?.id);

    const [parts, setParts] = useState<Option[]>([]);
    const [partOpt, setPartOpt] = useState<Option | null>(null);

    const [equipmentRoom, setEquipmentRoom] = useState<string>("");
    const [countPc, setCountPc] = useState<string>("");
    const [configuration, setConfiguration] = useState<string>("");
    const [invitationSolveProblems, setInvitationSolveProblems] = useState<string>("");
    const [countPerson, setCountPerson] = useState<string>("");

    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingUrls, setExistingUrls] = useState<string[]>([]);
    const [clearExisting, setClearExisting] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const imgRef = useRef<HTMLInputElement | null>(null);

    const initialExisting = useMemo(() => {
        const arr = initialData?.photo_reports ?? [];
        if (!Array.isArray(arr)) return [];
        return arr
            .map((x: any) => (typeof x === "string" ? x : x?.report_thumbnail))
            .filter(Boolean) as string[];
    }, [initialData?.photo_reports]);

    useEffect(() => {
        const urls = images.map((f) => URL.createObjectURL(f));
        setImagePreviews(urls);
        return () => {
            urls.forEach((u) => URL.revokeObjectURL(u));
        };
    }, [images]);

    useEffect(() => {
        if (!isOpen) return;

        setSubmitting(false);
        setImages([]);
        setImagePreviews([]);
        setExistingUrls(initialExisting);
        setClearExisting(false);

        setEquipmentRoom(initialData?.equipment_room != null ? String(initialData.equipment_room) : "");
        setCountPc(initialData?.count_pc_jcats != null ? String(initialData.count_pc_jcats) : "");
        setConfiguration(initialData?.configuration ?? "");
        setInvitationSolveProblems(initialData?.invitation_solve_problems ?? "");
        setCountPerson(initialData?.count_person != null ? String(initialData.count_person) : "");

        if (isSuper) {
            (async () => {
                try {
                    const list = await techBaseService.getPartOfDepartments();
                    const opts: Option[] = list.map((p: PartOfDepartment) => ({
                        value: p.id,
                        label: p.department ? `${p.name} — ${p.department}` : p.name,
                    }));
                    setParts(opts);

                    const byId =
                        typeof initialData?.part_of_department_id === "number"
                            ? opts.find((o) => o.value === initialData!.part_of_department_id)
                            : null;

                    if (byId) setPartOpt(byId);
                    else if (initialData?.part_of_department) {
                        const byName = opts.find((o) => o.label.startsWith(initialData.part_of_department as string));
                        setPartOpt(byName || null);
                    } else {
                        setPartOpt(null);
                    }
                } catch {
                    setParts([]);
                    setPartOpt(null);
                }
            })();
        } else {
            setParts([]);
            setPartOpt(null);
        }
    }, [isOpen, isSuper, initialData?.id, initialExisting]);

    if (!isOpen) return null;

    const onPickImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files ? Array.from(e.target.files) : [];
        if (!picked.length) return;
        setImages((prev) => {
            const all = [...prev, ...picked];
            const key = (f: File) => `${f.name}-${f.size}-${(f as any).lastModified ?? 0}`;
            const map = new Map<string, File>();
            all.forEach((f) => map.set(key(f), f));
            return Array.from(map.values());
        });
        if (imgRef.current) imgRef.current.value = "";
    };

    const clearImages = () => {
        setImages([]);
        if (existingUrls.length) {
            setExistingUrls([]);
            setClearExisting(true);
        }
        if (imgRef.current) imgRef.current.value = "";
    };

    const removeImageAt = (i: number) => {
        setImages((prev) => prev.filter((_, idx) => idx !== i));
    };

    const onPartChange = (opt: SingleValue<Option>) => setPartOpt(opt ?? null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const fd = new FormData();
        if (isSuper && partOpt?.value) fd.append("part_of_department", String(partOpt.value));
        fd.append("equipment_room", equipmentRoom.trim());
        fd.append("count_pc_jcats", countPc.trim());
        fd.append("configuration", configuration.trim());
        fd.append("invitation_solve_problems", invitationSolveProblems.trim());
        fd.append("count_person", countPerson.trim());

        images.forEach((f, i) => fd.append(`photo_reports[${i}][report_thumbnail]`, f));

        if (clearExisting) fd.append("clear_existing_photos", "1");

        setSubmitting(true);
        try {
            await onSubmit(fd, initialData?.id);
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    const canSubmit =
        equipmentRoom.trim() !== "" &&
        countPc.trim() !== "" &&
        configuration.trim() !== "" &&
        invitationSolveProblems.trim() !== "" &&
        countPerson.trim() !== "" &&
        (!isSuper || Boolean(partOpt?.value));

    return (
        <div
            className="techbase-modal-overlay"
            onMouseDown={(e) => e.target === e.currentTarget && !submitting && onClose()}
        >
            <div className="techbase-modal" role="dialog" aria-modal="true">
                <h3 className="techbase-title">{isEdit ? "Texnik baza — tahrirlash" : "Texnik baza — qo‘shish"}</h3>

                {(existingUrls.length > 0 || imagePreviews.length > 0) && (
                    <div className="techbase-previews">
                        {existingUrls.map((src, i) => (
                            <div className="techbase-thumb" key={`ex-${i}`} title="Joriy rasm">
                                <img src={src} alt={`existing-${i}`} />
                                <span className="thumb-badge">Joriy</span>
                            </div>
                        ))}

                        {imagePreviews.map((src, i) => (
                            <div className="techbase-thumb" key={`new-${i}`} title="Yangi rasm">
                                <img src={src} alt={`new-${i}`} />
                                <button
                                    type="button"
                                    className="thumb-remove"
                                    onClick={() => removeImageAt(i)}
                                    aria-label="Ushbu yangi rasmni olib tashlash"
                                    title="Olib tashlash"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <form className="techbase-form" onSubmit={handleSubmit}>
                    {isSuper && (
                        <div className="techbase-input-group">
                            <label>Bo‘linma</label>
                            <Select
                                classNamePrefix="rs"
                                styles={selectStyles}
                                options={parts}
                                value={partOpt}
                                onChange={onPartChange}
                                placeholder="Bo‘linmani tanlang"
                                isClearable
                            />
                        </div>
                    )}

                    <div className="techbase-grid">
                        <div className="techbase-input-group">
                            <label>Jihoz xonasi</label>
                            <input
                                type="number"
                                value={equipmentRoom}
                                onChange={(e) => setEquipmentRoom(e.target.value)}
                                placeholder="Masalan: 12"
                                required
                            />
                        </div>

                        <div className="techbase-input-group">
                            <label>JCATS kompyuterlar</label>
                            <input
                                type="number"
                                value={countPc}
                                onChange={(e) => setCountPc(e.target.value)}
                                placeholder="Masalan: 5"
                                required
                            />
                        </div>

                        <div className="techbase-input-group">
                            <label>Konfiguratsiya</label>
                            <input
                                type="text"
                                value={configuration}
                                onChange={(e) => setConfiguration(e.target.value)}
                                placeholder="Masalan: OZU-16Gb, HDD-512Gb, SSD-512Gb "
                                required
                            />
                        </div>

                        <div className="techbase-input-group">
                            <label>Muammolarni hal etish</label>
                            <input
                                type="text"
                                value={invitationSolveProblems}
                                onChange={(e) => setInvitationSolveProblems(e.target.value)}
                                placeholder="Masalan: yo‘q"
                                required
                            />
                        </div>

                        <div className="techbase-input-group">
                            <label>Xodimlar soni</label>
                            <input
                                type="number"
                                value={countPerson}
                                onChange={(e) => setCountPerson(e.target.value)}
                                placeholder="Masalan: 10"
                                required
                            />
                        </div>

                        <div className="techbase-input-group">
                            <label>Rasmlar</label>
                            <input
                                ref={imgRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={onPickImages}
                                style={{ display: "none" }}
                            />
                            <div className="techbase-filefield">
                <span className="techbase-filetext">
                  {images.length
                      ? `${images.length} ta rasm tanlandi`
                      : existingUrls.length
                          ? `Joriy: ${existingUrls.length} ta rasm`
                          : "Rasm tanlanmagan"}
                </span>

                                {(images.length > 0 || existingUrls.length > 0) && (
                                    <button type="button" className="techbase-fileclear" onClick={clearImages} title="Barchasini tozalash">
                                        <SiCcleaner size={16} style={{ marginRight: 6 }} />
                                        Tozalash
                                    </button>
                                )}

                                <button
                                    type="button"
                                    className="techbase-fileopen"
                                    onClick={() => imgRef.current?.click()}
                                    title="Rasmlar yuklash"
                                    aria-label="Rasmlar yuklash"
                                >
                                    <RiImageAddFill />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="techbase-buttons">
                        <button type="submit" className="techbase-submit" disabled={submitting || !canSubmit}>
                            {isEdit ? "Saqlash" : "Qo‘shish"}
                        </button>
                        <button type="button" className="techbase-cancel" onClick={onClose} disabled={submitting}>
                            Bekor qilish
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TechBaseModal;
