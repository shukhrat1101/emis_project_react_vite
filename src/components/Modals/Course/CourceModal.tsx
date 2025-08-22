// src/components/Modals/Course/CourceModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import teachYearService from "../../../services/teachYearService";
import "../Modal.scss";
import "./CourceModal.scss";
import { toast } from "react-toastify";

type SelectOption = { value: number; label: string };

interface TeachYear {
  id: number;
  start_year: number;
  end_year: number;
}

export interface CourseInitial {
  id?: number;
  course_name?: string;
  course_place?: string;
  start_date?: string;
  end_date?: string;
  course_year?: number | string;
  student_count?: number;
}

export interface CoursePayload {
  course_name: string;
  course_place: string;
  start_date: string;
  end_date: string;
  course_year: number;
  student_count: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CoursePayload) => void | Promise<void>;
  initialData?: CourseInitial;
}

const CourceModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [years, setYears] = useState<TeachYear[]>([]);
  const [yearOptions, setYearOptions] = useState<SelectOption[]>([]);
  const [yearValue, setYearValue] = useState<SelectOption | null>(null);

  const [courseName, setCourseName] = useState("");
  const [coursePlace, setCoursePlace] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [studentCount, setStudentCount] = useState<number>(0);

  const isEdit = useMemo(() => Boolean(initialData?.id), [initialData?.id]);

  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      try {
        const list = await teachYearService.getAll();
        setYears(list);
        const opts = list.map((y) => ({
          value: y.id,
          label: `${y.start_year}–${y.end_year}`,
        }));
        setYearOptions(opts);

        setCourseName(initialData?.course_name ?? "");
        setCoursePlace(initialData?.course_place ?? "");
        setStartDate(initialData?.start_date ?? "");
        setEndDate(initialData?.end_date ?? "");
        setStudentCount(
          typeof initialData?.student_count === "number" ? initialData.student_count! : 0
        );

        if (initialData?.course_year != null) {
          if (typeof initialData.course_year === "number") {
            const found = opts.find((o) => o.value === initialData.course_year);
            setYearValue(found || null);
          } else {
            const byLabel = opts.find((o) => o.label === String(initialData.course_year));
            setYearValue(byLabel || null);
          }
        } else {
          setYearValue(null);
        }
      } catch (e) {
        toast.error("O‘quv yillarini yuklashda xatolik!");
      }
    })();
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!startDate || years.length === 0 || yearOptions.length === 0) return;
    const y = new Date(startDate).getFullYear();
    if (Number.isNaN(y)) return;

    const match = years.find((yy) => y >= yy.start_year && y <= yy.end_year);
    if (match) {
      const opt = yearOptions.find((o) => o.value === match.id);
      if (opt && (!yearValue || yearValue.value !== opt.value)) {
        setYearValue(opt);
      }
    }
  }, [startDate, years, yearOptions, yearValue]);

  const handleChangeStart = (val: string) => {
    setStartDate(val);
    if (endDate && val && endDate < val) {
      setEndDate(val);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) return toast.warning("Kurs nomini kiriting.");
    if (!coursePlace.trim()) return toast.warning("O‘tkazish joyini kiriting.");
    if (!startDate) return toast.warning("Boshlanish sanasini tanlang.");
    if (!endDate) return toast.warning("Tugash sanasini tanlang.");
    if (endDate < startDate) return toast.warning("Tugash sanasi boshlanish sanasidan oldin bo‘lishi mumkin emas.");
    if (!yearValue) return toast.warning("O‘quv yilini tanlang.");

    const payload: CoursePayload = {
      course_name: courseName.trim(),
      course_place: coursePlace.trim(),
      start_date: startDate,
      end_date: endDate,
      course_year: yearValue.value,
      student_count: Number.isFinite(studentCount) ? studentCount : 0,
    };
    onSubmit(payload);
  };

  return (
    <div className="cource-modal-overlay">
      <div className="cource-modal">
        <h3>{isEdit ? "Kursni tahrirlash" : "Kurs qo‘shish"}</h3>

        <form className="form" onSubmit={handleSubmit}>
          <div className="cource-input-group">
            <label htmlFor="course_name">Kurs nomi</label>
            <input
              id="course_name"
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Masalan: Python kurslari"
              required
            />
          </div>

          <div className="cource-input-group">
            <label htmlFor="course_place">O‘tkazish joyi</label>
            <input
              id="course_place"
              type="text"
              value={coursePlace}
              onChange={(e) => setCoursePlace(e.target.value)}
              placeholder="Masalan: IT Park Tashkent"
              required
            />
          </div>

          <div className="cource-input-group">
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

          <div className="cource-input-group">
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

          <div className="cource-input-group">
            <label htmlFor="student_count">Tinglovchilar soni</label>
            <input
              id="student_count"
              type="number"
              min={0}
              value={studentCount}
              onChange={(e) => setStudentCount(Number(e.target.value || 0))}
              required
            />
          </div>

          <div className="cource-modal-buttons">
            <button type="submit" className="submit">
              {isEdit ? "Saqlash" : "Qo‘shish"}
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

export default CourceModal;
