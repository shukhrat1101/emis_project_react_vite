// src/components/Modals/Competition/CompetitionModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import "../Modal.scss";
import "./CompetitionModal.scss";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import teachYearService from "../../../services/teachYearService";
import shtatService from "../../../services/shtatService";

type SelectOption = { value: number; label: string };
type ChoiceOption = { value: string; label: string };

interface TeachYear {
  id: number;
  start_year: number;
  end_year: number;
}

export interface CompetitionInitial {
  id?: number;
  type?: string;
  lesson?: string;
  competition_place?: string;
  start_date?: string;
  end_date?: string;
  teaching_year?: number | string | null;
}

export interface CompetitionPayload {
  type: string;
  lesson: string;
  competition_place: string;
  start_date: string;
  end_date: string;
  teaching_year?: number | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CompetitionPayload) => void | Promise<void>;
  initialData?: CompetitionInitial;
}

const ALLOWED_TYPES = ["strategik", "operativ"];

const CompetitionModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [typeOptions, setTypeOptions] = useState<ChoiceOption[]>([]);
  const [typeValue, setTypeValue] = useState<ChoiceOption | null>(null);

  const [years, setYears] = useState<TeachYear[]>([]);
  const [yearOptions, setYearOptions] = useState<SelectOption[]>([]);
  const [yearValue, setYearValue] = useState<SelectOption | null>(null);

  const [lesson, setLesson] = useState("");
  const [place, setPlace] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isEdit = useMemo(() => Boolean(initialData?.id), [initialData?.id]);

  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      try {
        const degreesRaw = await shtatService.getDegrees();
        const filtered = degreesRaw.filter(
          (d) => ALLOWED_TYPES.includes(String(d.value).toLowerCase())
        );
        setTypeOptions(filtered);

        const list = await teachYearService.getAll();
        setYears(list);
        const opts = list.map((y) => ({
          value: y.id,
          label: `${y.start_year}–${y.end_year}`,
        }));
        setYearOptions(opts);

        setLesson(initialData?.lesson ?? "");
        setPlace(initialData?.competition_place ?? "");
        setStartDate(initialData?.start_date ?? "");
        setEndDate(initialData?.end_date ?? "");

        if (initialData?.type) {
          const norm = String(initialData.type).toLowerCase();
          if (ALLOWED_TYPES.includes(norm)) {
            const foundType = filtered.find(
              (d) => String(d.value).toLowerCase() === norm
            );
            setTypeValue(foundType || null);
          } else {
            setTypeValue(null);
          }
        } else {
          setTypeValue(null);
        }

        if (initialData?.teaching_year != null) {
          if (typeof initialData.teaching_year === "number") {
            const found = opts.find((o) => o.value === initialData.teaching_year);
            setYearValue(found || null);
          } else if (typeof initialData.teaching_year === "string") {
            const byLabel = opts.find((o) => o.label === initialData.teaching_year);
            setYearValue(byLabel || null);
          } else {
            setYearValue(null);
          }
        } else {
          setYearValue(null);
        }
      } catch {
        toast.error("Ma'lumotlarni yuklashda xatolik!");
      }
    })();
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!startDate || !endDate || years.length === 0 || yearOptions.length === 0) return;
    const sd = new Date(startDate);
    const ed = new Date(endDate);
    if (isNaN(sd.getTime()) || isNaN(ed.getTime())) return;

    const sdy = sd.getFullYear();
    const edy = ed.getFullYear();

    const match = years.find(
      (y) => sdy >= y.start_year && sdy <= y.end_year && edy >= y.start_year && edy <= y.end_year
    );
    if (match) {
      const opt = yearOptions.find((o) => o.value === match.id);
      if (opt && (!yearValue || yearValue.value !== opt.value)) {
        setYearValue(opt);
      }
    }
  }, [startDate, endDate, years, yearOptions, yearValue]);

  if (!isOpen) return null;

  const handleChangeStart = (val: string) => {
    setStartDate(val);
    if (endDate && val && endDate < val) {
      setEndDate(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeValue) return toast.warning("Daraja turini tanlang.");
    if (!lesson.trim()) return toast.warning("Mavzuni kiriting.");
    if (!place.trim()) return toast.warning("O‘tkazish joyini kiriting.");
    if (!startDate) return toast.warning("Boshlanish sanasini tanlang.");
    if (!endDate) return toast.warning("Tugash sanasini tanlang.");
    if (endDate < startDate) return toast.warning("Tugash sanasi boshlanish sanasidan oldin bo‘lishi mumkin emas.");
    if (!yearValue) return toast.warning("O‘quv yilini tanlang.");

    const payload: CompetitionPayload = {
      type: typeValue.value,
      lesson: lesson.trim(),
      competition_place: place.trim(),
      start_date: startDate,
      end_date: endDate,
      teaching_year: yearValue?.value ?? null,
    };
    onSubmit(payload);
  };

  return (
    <div className="competition-modal-overlay">
      <div className="competition-modal">
        <h3>{isEdit ? "Musobaqani tahrirlash" : "Musobaqa qo‘shish"}</h3>

        <form className="form" onSubmit={handleSubmit}>
          <div className="competition-input-group">
            <label>Daraja turi</label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={typeOptions}
              value={typeValue}
              onChange={(v) => setTypeValue(v as ChoiceOption)}
              placeholder="Tanlang"
              isClearable={false}
            />
          </div>

          <div className="competition-input-group">
            <label htmlFor="lesson">Mavzu</label>
            <input
              id="lesson"
              type="text"
              value={lesson}
              onChange={(e) => setLesson(e.target.value)}
              placeholder="Masalan: Jcats musobaqasi"
              required
            />
          </div>

          <div className="competition-input-group">
            <label htmlFor="place">O‘tkazish joyi</label>
            <input
              id="place"
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Masalan: Tashkent shahri"
              required
            />
          </div>

          <div className="competition-input-group">
            <label>Sanalar</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleChangeStart(e.target.value)}
                required
              />
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="competition-input-group">
            <label>O‘quv yili</label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={yearOptions}
              value={yearValue}
              onChange={(v) => setYearValue(v as SelectOption)}
              placeholder="O‘quv yilini tanlang"
              isClearable={false}
            />
          </div>

          <div className="competition-modal-buttons">
            <button type="submit" className="submit">{isEdit ? "Saqlash" : "Qo‘shish"}</button>
            <button type="button" className="cancel" onClick={onClose}>Bekor qilish</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompetitionModal;
