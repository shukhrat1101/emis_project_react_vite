// components/Modals/Shtat/ShtatModal.tsx
import React, { useEffect, useState } from "react";
import Select from "react-select";
import shtatService from "../../../services/shtatService";
import positionService from "../../../services/positionService";
import "./ShtatModal.scss";
import "../Modal.scss";
import { toast } from "react-toastify";

export type GroupName = "Offitser" | "Serjant" | "Xizmatchi";

type PositionOption = {
    value: number | string;
    label: string;
    type: "off" | "ser" | "emp";
};

interface DegreeOption {
    value: string | number;
    label: string;
}

interface ContingentTableForm {
    type: GroupName;
    count_person: number;
    position: (PositionOption | null)[];
}

export interface ShtatOut {
    degree: string;
    contingent_tables: Array<{
        type: GroupName;
        count_person: number;
        position: (string | number)[];
    }>;
}

export interface ShtatIn {
    degree: string;
    contingent_tables: Array<{
        type: GroupName;
        count_person: number;
        position: Array<number | string | { id: number | string; name: string }>;
    }>;
}

interface ShtatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: ShtatOut) => void;
    initialData?: ShtatIn;
}

const DEFAULT_TYPES: GroupName[] = ["Offitser", "Serjant", "Xizmatchi"];

const groupFromType = (t?: string): GroupName | undefined => {
    const x = (t || "").toLowerCase();
    if (x === "off") return "Offitser";
    if (x === "ser") return "Serjant";
    if (x === "emp") return "Xizmatchi";
    return undefined;
};

const typeFromGroup = (g: GroupName): "off" | "ser" | "emp" => {
    if (g === "Offitser") return "off";
    if (g === "Serjant") return "ser";
    return "emp";
};

const ShtatModal: React.FC<ShtatModalProps> = ({
                                                   isOpen,
                                                   onClose,
                                                   onSubmit,
                                                   initialData,
                                               }) => {
    const [degreeOptions, setDegreeOptions] = useState<DegreeOption[]>([]);
    const [degree, setDegree] = useState<DegreeOption | null>(null);

    const [positions, setPositions] = useState<Record<GroupName, PositionOption[]>>({
        Offitser: [],
        Serjant: [],
        Xizmatchi: [],
    });

    const [contingents, setContingents] = useState<ContingentTableForm[]>([]);
    const [errors, setErrors] = useState<Record<GroupName, boolean[]>>({
        Offitser: [],
        Serjant: [],
        Xizmatchi: [],
    });

    useEffect(() => {
        if (!isOpen) return;

        (async () => {
            try {
                const degrees = await shtatService.getDegrees(); // [{value,label}]
                setDegreeOptions(degrees);

                const posList = (await positionService.getSelectList()) as PositionOption[];

                const grouped: Record<GroupName, PositionOption[]> = {
                    Offitser: [],
                    Serjant: [],
                    Xizmatchi: [],
                };
                posList.forEach((p) => {
                    const g = groupFromType(p.type);
                    if (g) grouped[g].push(p);
                });
                setPositions(grouped);

                if (initialData) {
                    const selDeg =
                        degrees.find(
                            (d) =>
                                String(d.value).toLowerCase() === String(initialData.degree).toLowerCase()
                        ) || null;
                    setDegree(selDeg);

                    const restored: ContingentTableForm[] = DEFAULT_TYPES.map((g) => {
                        const ex = initialData.contingent_tables.find((c) => c.type === g);
                        if (!ex) return { type: g, count_person: 0, position: [] };

                        const listForGroup = grouped[g] || [];
                        const mapped: (PositionOption | null)[] = (ex.position || []).map((pid) => {
                            const id = typeof pid === "object" ? pid.id : pid;
                            const name = typeof pid === "object" ? pid.name : undefined;
                            const found = listForGroup.find((opt) => opt.value === id);
                            return (
                                found || {
                                    value: id,
                                    label: name ?? "Nomaʼlum lavozim",
                                    type: typeFromGroup(g),
                                }
                            );
                        });

                        return {
                            type: g,
                            count_person: ex.count_person,
                            position: mapped,
                        };
                    });

                    setContingents(restored);
                    setErrors({
                        Offitser: Array(
                            restored.find((x) => x.type === "Offitser")?.count_person || 0
                        ).fill(false),
                        Serjant: Array(
                            restored.find((x) => x.type === "Serjant")?.count_person || 0
                        ).fill(false),
                        Xizmatchi: Array(
                            restored.find((x) => x.type === "Xizmatchi")?.count_person || 0
                        ).fill(false),
                    });
                } else {
                    setDegree(null);
                    const empty: ContingentTableForm[] = [
                        { type: "Offitser", count_person: 0, position: [] },
                        { type: "Serjant", count_person: 0, position: [] },
                        { type: "Xizmatchi", count_person: 0, position: [] },
                    ];
                    setContingents(empty);
                    setErrors({ Offitser: [], Serjant: [], Xizmatchi: [] });
                }
            } catch (e) {
                console.error("Yuklash xatosi:", e);
                toast.error("Maʼlumotlarni yuklashda xatolik yuz berdi");
            }
        })();
    }, [isOpen, initialData]);

    const handleSubmit = () => {
        if (!degree) {
            toast.warning("Shtat darajasini tanlang");
            return;
        }

        let ok = true;
        const newErrors: Record<GroupName, boolean[]> = {
            Offitser: [],
            Serjant: [],
            Xizmatchi: [],
        };

        contingents.forEach((c) => {
            if (c.count_person > 0) {
                const errs = Array.from({ length: c.count_person }, (_, i) => !c.position[i]);
                newErrors[c.type] = errs;
                if (errs.some(Boolean)) ok = false;
            } else {
                newErrors[c.type] = [];
            }
        });

        setErrors(newErrors);
        if (!ok) {
            toast.warning("Barcha lavozimlarni to‘liq tanlang!");
            return;
        }

        const payload: ShtatOut = {
            degree: String(degree.value),
            contingent_tables: contingents.map((c) => ({
                type: c.type,
                count_person: c.count_person,
                position: c.position.map((p) => p!.value),
            })),
        };

        onSubmit(payload);
    };

    const updatePersonCount = (type: GroupName, val: number) => {
        const value = Number.isFinite(val) && val > 0 ? Math.floor(val) : 0;
        const updated = contingents.map((c) =>
            c.type === type
                ? {
                    ...c,
                    count_person: value,
                    position: Array.from({ length: value }, (_, i) => c.position?.[i] ?? null),
                }
                : c
        );
        setContingents(updated);

        setErrors((prev) => ({
            ...prev,
            [type]: Array.from({ length: value }, (_, i) => prev[type]?.[i] ?? false),
        }));
    };

    const handlePositionChange = (
        type: GroupName,
        index: number,
        selected: PositionOption | null
    ) => {
        const updated = contingents.map((c) => {
            if (c.type !== type) return c;
            const pos = [...(c.position || [])];
            pos[index] = selected;
            return { ...c, position: pos };
        });
        setContingents(updated);

        setErrors((prev) => {
            const arr = [...(prev[type] || [])];
            arr[index] = false;
            return { ...prev, [type]: arr };
        });
    };

    if (!isOpen) return null;

    return (
        <div className="shtat-modal-overlay" onClick={onClose}>
            <div className="shtat-modal" onClick={(e) => e.stopPropagation()}>
                <h3>{initialData ? "Shtatni tahrirlash" : "Shtat qo‘shish"}</h3>

                <div className="form">
                    <label>Shtat darajasi</label>
                    <Select
                        className="react-select-container"
                        classNamePrefix="react-select"
                        options={degreeOptions}
                        value={degree}
                        onChange={(v) => setDegree(v)}
                        placeholder="Darajani tanlang"
                    />

                    {contingents.map((c) => (
                        <div key={c.type} className="shtat-input-group">
                            <label>{c.type} soni</label>
                            <input
                                type="number"
                                min={0}
                                value={c.count_person}
                                onChange={(e) => updatePersonCount(c.type, Number(e.target.value || 0))}
                            />

                            {c.count_person > 0 && (
                                <div className="position-selects">
                                    {Array.from({ length: c.count_person }).map((_, idx) => (
                                        <div key={idx} className="position-select-item">
                                            <label>{idx + 1}-lavozim:</label>
                                            <Select
                                                className="react-select-container"
                                                classNamePrefix="react-select"
                                                options={positions[c.type] || []}
                                                value={c.position?.[idx] || null}
                                                onChange={(selected) =>
                                                    handlePositionChange(c.type, idx, selected as PositionOption | null)
                                                }
                                                placeholder="Lavozim tanlang"
                                                isClearable={false}
                                            />
                                            {errors[c.type]?.[idx] && (
                                                <div className="error-text">Lavozim tanlanishi shart</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="shtat-modal-buttons">
                        <button className="submit" onClick={handleSubmit}>
                            {initialData ? "Saqlash" : "Qo‘shish"}
                        </button>
                        <button className="cancel" onClick={onClose}>
                            Bekor qilish
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShtatModal;
