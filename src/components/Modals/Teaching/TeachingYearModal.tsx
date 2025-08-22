// src/components/Modals/TeachYear/TeachYearModal.tsx
import React, { useEffect, useState } from "react";
import teachYearService from "../../../services/teachYearService";
import "./TachingYearModal.scss";
import "../Modal.scss";

interface TeachingYear {
  id?: number;
  start_year: number;
  end_year: number;
}

interface TeachYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  initialData?: TeachingYear;
}

const TeachYearModal: React.FC<TeachYearModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [startYear, setStartYear] = useState<string>("");
  const [endYear, setEndYear] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setStartYear(initialData?.start_year ? String(initialData.start_year) : "");
    setEndYear(initialData?.end_year ? String(initialData.end_year) : "");
    setError("");
  }, [initialData, isOpen]);

  const handleStartChange = (v: string) => {
    setStartYear(v);
    const s = v === "" ? undefined : Number(v);
    const e = endYear === "" ? undefined : Number(endYear);
    const err = teachYearService.validate(
      typeof s === "number" && !Number.isNaN(s) ? s : undefined,
      typeof e === "number" && !Number.isNaN(e) ? e : undefined
    );
    setError(err ?? "");
  };

  const handleEndChange = (v: string) => {
    setEndYear(v);
    const s = startYear === "" ? undefined : Number(startYear);
    const e = v === "" ? undefined : Number(v);
    const err = teachYearService.validate(
      typeof s === "number" && !Number.isNaN(s) ? s : undefined,
      typeof e === "number" && !Number.isNaN(e) ? e : undefined
    );
    setError(err ?? "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const s = startYear === "" ? undefined : Number(startYear);
    const eY = endYear === "" ? undefined : Number(endYear);

    const err = teachYearService.validate(
      typeof s === "number" && !Number.isNaN(s) ? s : undefined,
      typeof eY === "number" && !Number.isNaN(eY) ? eY : undefined
    );
    if (err) {
      setError(err);
      return;
    }

    const formData = new FormData();
    formData.append("start_year", String(s));
    formData.append("end_year", String(eY));

    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  const isDisabled =
    startYear === "" || endYear === "" || Boolean(error);

  return (
    <div className="teach-year-modal-overlay">
      <div className="teach-year-modal">
        <h3>{initialData ? "O‘quv yilini tahrirlash" : "O‘quv yili qo‘shish"}</h3>

        <form onSubmit={handleSubmit} className="form">
          <label>Boshlanish yili</label>
          <input
            type="number"
            placeholder="Masalan: 2026"
            value={startYear}
            onChange={(e) => handleStartChange(e.target.value)}
            required
            min={1900}
          />

          <label>Tugash yili</label>
          <input
            type="number"
            placeholder="Masalan: 2027"
            value={endYear}
            onChange={(e) => handleEndChange(e.target.value)}
            required
            min={1900}
          />

          {error && <div className="teach-year-modal-error">{error}</div>}

          <div className="teach-year-modal-buttons">
            <button type="submit" className="submit" disabled={isDisabled}>
              {initialData ? "Saqlash" : "Qo‘shish"}
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

export default TeachYearModal;
