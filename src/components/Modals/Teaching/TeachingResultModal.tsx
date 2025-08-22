// src/components/Modals/Teaching/TeachingResultModal.tsx
import React, {useEffect, useMemo, useRef, useState} from "react";
import {useParams} from "react-router-dom";
import {FaFileCirclePlus} from "react-icons/fa6";
import {toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Modal.scss";
import "./TeachingResultModal.scss";

export interface TeachingResultInitial {
    id?: number;
    overall_score?: string | null;
    summary?: string;
    suggestions?: string;
    teaching?: number | string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData) => void | Promise<void>;
    initialData?: TeachingResultInitial;
    teachingId?: number;
}

const TeachingResultModal: React.FC<Props> = ({
                                                  isOpen,
                                                  onClose,
                                                  onSubmit,
                                                  initialData,
                                                  teachingId,
                                              }) => {
    const params = useParams();
    const derivedTeachingId = useMemo(() => {
        if (typeof teachingId === "number") return teachingId;
        const t = initialData?.teaching;
        if (typeof t === "number") return t;
        if (typeof t === "string" && !Number.isNaN(Number(t))) return Number(t);
        if (params.id && !Number.isNaN(Number(params.id))) return Number(params.id);
        return undefined;
    }, [teachingId, initialData?.teaching, params.id]);

    const [summary, setSummary] = useState("");
    const [suggestions, setSuggestions] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setSummary(initialData?.summary ?? "");
        setSuggestions(initialData?.suggestions ?? "");
        setFile(null);
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleFileClick = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        if (f && !/\.(pdf|doc|docx)$/i.test(f.name)) {
            toast.warning("Faqat .pdf, .doc, .docx fayllar ruxsat etiladi.");
            e.target.value = "";
            setFile(null);
            return;
        }
        setFile(f);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!derivedTeachingId) return toast.warning("O‘quv ID topilmadi.");
        if (!summary.trim()) return toast.warning("Xulosa maydonini to‘ldiring.");
        if (!suggestions.trim()) return toast.warning("Taklif maydonini to‘ldiring.");

        const fd = new FormData();
        fd.append("teaching", String(derivedTeachingId));
        fd.append("summary", summary.trim());
        fd.append("suggestions", suggestions.trim());
        if (file) fd.append("overall_score", file);
        onSubmit(fd);
    };

    return (
        <div className="result-modal-overlay">
            <div className="result-modal">
                <div className="modal-header">
                    <h3>{initialData?.id ? "Natijani tahrirlash" : "Natija kiritish"}</h3>
                </div>

                <form className="form" onSubmit={handleSubmit}>
                    <div className="result-input-group">
                        <label htmlFor="res-summary">Xulosa</label>
                        <textarea
                            id="res-summary"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="Qisqa xulosa yozing"
                            required
                        />
                    </div>

                    <div className="result-input-group">
                        <label htmlFor="res-suggestions">Taklif</label>
                        <textarea
                            id="res-suggestions"
                            value={suggestions}
                            onChange={(e) => setSuggestions(e.target.value)}
                            placeholder="Takliflarni yozing"
                            required
                        />
                    </div>

                    <div className="result-input-group">

                        <div className="file-row">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx"
                                style={{display: "none"}}
                                onChange={handleFileChange}
                            />
                            <button type="button" className="file-btn" onClick={handleFileClick}>
                                <FaFileCirclePlus/> Fayl tanlash
                            </button>
                            <span className="file-name">
                {file?.name || (initialData?.overall_score ? "Oldingi fayl mavjud" : "Fayl tanlanmagan")}
              </span>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="submit"
                                className="btn primary">{initialData?.id ? "Saqlash" : "Qo‘shish"}</button>
                        <button type="button" className="btn secondary" onClick={onClose}>Bekor qilish</button>

                    </div>
                </form>
            </div>
        </div>
    );
};

export default TeachingResultModal;
