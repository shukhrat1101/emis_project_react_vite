// src/components/Modals/Teaching/TeachResearchModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaFileCirclePlus } from "react-icons/fa6";
import teachYearService from "../../../services/teachYearService";
import shtatService from "../../../services/shtatService";
import "./TachingYearModal.scss";
import "../Modal.scss";

type ChoiceOption = { value: string; label: string };
type YearOption = { value: number | string; label: string; start_year: number; end_year: number };

export interface TeachingResearchInitial {
    id?: number;
    teaching_type?: string;
    degree?: string;
    lesson?: string;
    leader?: string;
    teaching_place?: string;
    start_date?: string;
    end_date?: string;
    plan?: string | null;
    teaching_year?: number | string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData) => void;
    initialData?: TeachingResearchInitial;
}

const TeachResearchModal: React.FC<Props> = ({
                                                 isOpen,
                                                 onClose,
                                                 onSubmit,
                                                 initialData,
                                             }) => {
    const [typeOptions, setTypeOptions] = useState<ChoiceOption[]>([
        { value: "O'quv", label: "O'quv" },
        { value: "Tadqiqot", label: "Tadqiqot" },
    ]);
    const [typeValue, setTypeValue] = useState<string>("");

    const [degreeOptions, setDegreeOptions] = useState<ChoiceOption[]>([]);
    const [degreeValue, setDegreeValue] = useState<string>("");

    const [yearOptions, setYearOptions] = useState<YearOption[]>([]);
    const [yearId, setYearId] = useState<number | string>("");

    const [lesson, setLesson] = useState("");
    const [leader, setLeader] = useState("");
    const [place, setPlace] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [error, setError] = useState<string>("");

    const getYearsWithMeta = async (): Promise<YearOption[]> => {
        const list = await teachYearService.getAll();
        return list.map((y) => ({
            value: y.id,
            label: `${y.start_year}–${y.end_year}`,
            start_year: y.start_year,
            end_year: y.end_year,
        }));
    };

    const startY = useMemo(() => (startDate ? new Date(startDate).getFullYear() : NaN), [startDate]);
    const endY   = useMemo(() => (endDate   ? new Date(endDate).getFullYear()   : NaN), [endDate]);

    const matchYear = useMemo(() => {
        if (!Number.isFinite(startY) || !Number.isFinite(endY)) return null;
        return yearOptions.find((y) => startY >= y.start_year && endY <= y.end_year) || null;
    }, [startY, endY, yearOptions]);

    const yearNotFound = useMemo(() => {
        if (!startDate || !endDate) return false;
        return !matchYear;
    }, [startDate, endDate, matchYear]);

    useEffect(() => {
        if (!isOpen) return;

        setError("");

        setTypeValue(initialData?.teaching_type ?? "");
        setLesson(initialData?.lesson ?? "");
        setLeader(initialData?.leader ?? "");
        setPlace(initialData?.teaching_place ?? "");
        setStartDate(initialData?.start_date ?? "");
        setEndDate(initialData?.end_date ?? "");
        setFile(null);

        (async () => {
            try {
                const degrees = await shtatService.getDegrees();
                setDegreeOptions(degrees);
                if (initialData?.degree) {
                    const byValue = degrees.find((d) => d.value === initialData.degree);
                    const byLabel = degrees.find((d) => d.label === initialData.degree);
                    setDegreeValue(byValue?.value ?? byLabel?.value ?? "");
                } else {
                    setDegreeValue("");
                }
            } catch {
                setDegreeOptions([]);
                setDegreeValue("");
            }
        })();

        (async () => {
            try {
                const years = await getYearsWithMeta();
                setYearOptions(years);

                if (initialData?.teaching_year != null) {
                    const byId = years.find((y) => String(y.value) === String(initialData.teaching_year));
                    if (byId) setYearId(byId.value);
                    else {
                        const byLabel = years.find((y) => y.label === String(initialData.teaching_year));
                        setYearId(byLabel?.value ?? "");
                    }
                } else {
                    setYearId("");
                }
            } catch {
                setYearOptions([]);
                setYearId("");
            }
        })();
    }, [isOpen, initialData]);

    useEffect(() => {
        if (!startDate || !endDate) return;
        if (matchYear) {
            if (String(yearId) !== String(matchYear.value)) {
                setYearId(matchYear.value);
            }
        } else {
            if (yearId !== "") setYearId("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matchYear, startDate, endDate]);

    const handleFileClick = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] ?? null;
        setFile(f);
    };

    const validate = () => {
        if (!typeValue) return "O‘quv turi tanlanishi kerak.";
        if (!degreeValue) return "Darajani tanlang.";
        if (!lesson.trim()) return "Mavzu kiritilishi kerak.";
        if (!leader.trim()) return "Rahbar kiritilishi kerak.";
        if (!place.trim()) return "O‘tkazish joyi kiritilishi kerak.";
        if (!startDate) return "Boshlanish sanasi kiritilishi kerak.";
        if (!endDate) return "Tugash sanasi kiritilishi kerak.";

        const s = new Date(startDate).getTime();
        const e = new Date(endDate).getTime();
        if (Number.isFinite(s) && Number.isFinite(e) && s >= e) {
            return "Boshlanish sanasi tugash sanasidan kichik bo‘lishi kerak.";
        }

        if (!matchYear) {
            return "Boshlanish va tugash sanalariga to‘g‘ri keladigan o‘quv yili tanlanishi kerak.";
        }
        if (!yearId) {
            return "O‘quv yili tanlanishi kerak.";
        }

        if (!file) {
            return "Reja fayli majburiy.";
        }

        return null;
    };

    const disabled = useMemo(
        () => Boolean(validate()),
        [typeValue, degreeValue, lesson, leader, place, startDate, endDate, yearId, matchYear, file]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const err = validate();
        if (err) {
            setError(err);
            return;
        }
        setError("");

        const fd = new FormData();
        fd.append("teaching_type", typeValue);
        fd.append("degree", degreeValue);
        fd.append("lesson", lesson.trim());
        fd.append("leader", leader.trim());
        fd.append("teaching_place", place.trim());
        fd.append("start_date", startDate);
        fd.append("end_date", endDate);
        fd.append("teaching_year", String(yearId));
        fd.append("plan", file!);

        onSubmit(fd);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="teach-year-modal-overlay">
            <div className="teach-year-modal">
                <h3>{initialData?.id ? "O‘quv (tadqiqot)ni tahrirlash" : "Yangi o‘quv(tadqiqot) yaratish"}</h3>

                <form onSubmit={handleSubmit} className="form">
                    <label>O‘quv turi:</label>
                    <select value={typeValue} onChange={(e) => setTypeValue(e.target.value)}>
                        <option value="">Tanlang</option>
                        {typeOptions.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>

                    <label>Daraja:</label>
                    <select value={degreeValue} onChange={(e) => setDegreeValue(e.target.value)}>
                        <option value="">Tanlang</option>
                        {degreeOptions.map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                    </select>

                    <label>Mavzu:</label>
                    <input
                        type="text"
                        placeholder="O‘quv mavzusini kiriting"
                        value={lesson}
                        onChange={(e) => setLesson(e.target.value)}
                    />

                    <label>Rahbar:</label>
                    <input type="text" value={leader} onChange={(e) => setLeader(e.target.value)} />

                    <label>O‘tkazish joyi:</label>
                    <input type="text" value={place} onChange={(e) => setPlace(e.target.value)} />

                    <label>Boshlanish sanasi:</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

                    <label>Tugash sanasi:</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

                    <label>Reja fayli:</label>
                    <div className="file-row">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                        />
                        <button type="button" className="file-btn" onClick={handleFileClick}>
                            <FaFileCirclePlus /> Fayl tanlash
                        </button>
                        <span className="file-name">
              {file?.name
                  ? file.name
                  : initialData?.plan
                      ? "Oldingi fayl bor — yangisini tanlang (majburiy)"
                      : "Fayl tanlanmagan (majburiy)"}
            </span>
                    </div>

                    <label>O‘quv yili:</label>
                    <select value={String(yearId)} onChange={(e) => setYearId(e.target.value)}>
                        {yearNotFound ? (
                            <option value="" disabled>Mavjud emas</option>
                        ) : (
                            <option value="">Tanlang</option>
                        )}
                        {yearOptions.map((y) => (
                            <option key={String(y.value)} value={String(y.value)}>
                                {y.label}
                            </option>
                        ))}
                    </select>

                    {error && <div className="teach-year-modal-error">{error}</div>}

                    <div className="teach-year-modal-buttons">
                        <button type="submit" className="submit" disabled={disabled}>
                            {initialData?.id ? "Saqlash" : "Yaratish"}
                        </button>
                        <button type="button" className="cancel" onClick={onClose}>
                            Bekor qilish
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TeachResearchModal;
