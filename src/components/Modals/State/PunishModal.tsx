// src/components/Modals/PunishModal.tsx
import React, { useEffect, useState } from "react";
import "./StateModal.scss";

export type PunishInitial = {
    id?: number;
    biografic_data: number;
    who_punished: string;
    punishment_name: string;
    punishment_date: string;
    finished_date?: string | null;
    is_finished: boolean;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: PunishInitial, id?: number) => Promise<void> | void;
    initialData?: PunishInitial;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const PunishModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const isEdit = !!initialData?.id;

    const [who, setWho] = useState("");
    const [name, setName] = useState("");
    const [date, setDate] = useState("");
    const [finished, setFinished] = useState(false);
    const [finishedDate, setFinishedDate] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setSubmitting(false);
        setWho(initialData?.who_punished ?? "");
        setName(initialData?.punishment_name ?? "");
        setDate(initialData?.punishment_date ?? "");
        setFinished(Boolean(initialData?.is_finished));
        setFinishedDate(initialData?.finished_date ?? "");
    }, [isOpen, initialData?.id]);

    useEffect(() => {
        if (finished) setFinishedDate(todayISO());
        else setFinishedDate("");
    }, [finished]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload: PunishInitial = {
            id: initialData?.id,
            biografic_data: initialData!.biografic_data,
            who_punished: who.trim(),
            punishment_name: name.trim(),
            punishment_date: date,
            is_finished: finished,
            finished_date: finished ? finishedDate : null,
        };
        setSubmitting(true);
        try {
            await onSubmit(payload, initialData?.id);
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    const canSubmit =
        who.trim() !== "" &&
        name.trim() !== "" &&
        date.trim() !== "" &&
        (!finished || !!finishedDate);

    return (
        <div className="awpun-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="awpun-modal" role="dialog" aria-modal="true">
                <div className="awpun-modal-body">
                    <h3 className="awpun-name">{isEdit ? "Intizomiy taʼzir — tahrirlash" : "Intizomiy taʼzir — qo‘shish"}</h3>
                    <form className="awpun-form" onSubmit={handleSubmit}>
                        <div className="awpun-form-grid-3" style={{ gridTemplateColumns: "repeat(1, 1fr)" }}>
                            <label>
                                Kim tomonidan
                                <input value={who} onChange={(e) => setWho(e.target.value)} required />
                            </label>
                            <label>
                                Taʼzir nomi
                                <input value={name} onChange={(e) => setName(e.target.value)} required />
                            </label>
                            <label>
                                Sana
                                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                            </label>
                            {isEdit && finished && (
                                <label>
                                    Yechilgan sana
                                    <input type="date" value={finishedDate} readOnly />
                                </label>
                            )}
                        </div>

                        {isEdit && (
                            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 13, color: "#34495e" }}>
                                <input
                                    style={{ width: 16, height: 16 }}
                                    type="checkbox"
                                    checked={finished}
                                    onChange={(e) => setFinished(e.target.checked)}
                                />
                                Intizomiy taʼzirni yechish
                            </label>
                        )}

                        <div className="awpun-actions">
                            <button type="submit" className="awpun-btn-submit" disabled={submitting || !canSubmit}>
                                {isEdit ? "Saqlash" : "Qo‘shish"}
                            </button>
                            <button type="button" className="awpun-btn-cancel" onClick={onClose} disabled={submitting}>
                                Bekor qilish
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PunishModal;
