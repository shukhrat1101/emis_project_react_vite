// src/components/Modals/AwardModal.tsx
import React, { useEffect, useState } from "react";
import "./StateModal.scss";

export type AwardInitial = {
    id?: number;
    biografic_data: number;
    awarded_by: string;
    command_number: string;
    awarded_date: string;
    award_name: string;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: AwardInitial, id?: number) => Promise<void> | void;
    initialData?: AwardInitial;
};

const AwardModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const isEdit = !!initialData?.id;

    const [awardedBy, setAwardedBy] = useState("");
    const [commandNumber, setCommandNumber] = useState("");
    const [awardedDate, setAwardedDate] = useState("");
    const [awardName, setAwardName] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setSubmitting(false);
        setAwardedBy(initialData?.awarded_by ?? "");
        setCommandNumber(initialData?.command_number ?? "");
        setAwardedDate(initialData?.awarded_date ?? "");
        setAwardName(initialData?.award_name ?? "");
    }, [isOpen, initialData?.id]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload: AwardInitial = {
            id: initialData?.id,
            biografic_data: initialData!.biografic_data,
            awarded_by: awardedBy.trim(),
            command_number: commandNumber.trim(),
            awarded_date: awardedDate,
            award_name: awardName.trim(),
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
        awardedBy.trim() !== "" &&
        commandNumber.trim() !== "" &&
        awardedDate.trim() !== "" &&
        awardName.trim() !== "";

    return (
        <div className="awpun-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="awpun-modal" role="dialog" aria-modal="true">
                <div className="awpun-modal-body">
                    <h3 className="awpun-name">{isEdit ? "Rag‘batlantirish — tahrirlash" : "Rag‘batlantirish — qo‘shish"}</h3>
                    <form className="awpun-form" onSubmit={handleSubmit}>
                        <div className="awpun-form-grid-3">
                            <label>
                                Kim tomonidan
                                <input value={awardedBy} onChange={(e) => setAwardedBy(e.target.value)} required />
                            </label>
                            <label>
                                Buyruq raqami
                                <input value={commandNumber} onChange={(e) => setCommandNumber(e.target.value)} required />
                            </label>
                            <label>
                                Sana
                                <input type="date" value={awardedDate} onChange={(e) => setAwardedDate(e.target.value)} required />
                            </label>
                            <label style={{ gridColumn: "1 / -1" }}>
                                Mukofot nomi
                                <input value={awardName} onChange={(e) => setAwardName(e.target.value)} required />
                            </label>
                        </div>

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

export default AwardModal;
