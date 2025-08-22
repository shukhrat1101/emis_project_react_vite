// src/components/Modals/Competition/CompetitionResultModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaFileCirclePlus } from "react-icons/fa6";
import { FaSave } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "../Modal.scss";
import "./CompetitionResultModal.scss";

export interface CompetitionResultInitial {
  id?: number;
  result_file?: string | null;
  summary?: string | null;
  suggestions?: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fd: FormData) => void | Promise<void>;
  initialData?: CompetitionResultInitial;
}

const CompetitionResultModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const isEdit = useMemo(() => Boolean(initialData?.id), [initialData?.id]);

  const [summary, setSummary] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSummary(initialData?.summary ?? "");
    setSuggestions(initialData?.suggestions ?? "");
    setFile(null);
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handlePickFile = () => fileRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (
      f &&
      !/\.(pdf|doc|docx)$/i.test(f.name)
    ) {
      toast.warning("Faqat .pdf, .doc, .docx fayllar ruxsat etiladi.");
      e.target.value = "";
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("summary", summary || "");
    fd.append("suggestions", suggestions || "");
    if (file) fd.append("result_file", file);
    onSubmit(fd);
  };

  return (
    <div className="competres-modal-overlay">
      <div className="competres-modal">
        <h3 className="competres-title">
          {isEdit ? "Musobaqa natijasini tahrirlash" : "Musobaqa natijasini qo‘shish"}
        </h3>

        <form className="competres-form" onSubmit={handleSubmit}>
          <div className="competres-input-group">
            <label htmlFor="cr-summary">Xulosa</label>
            <textarea
              id="cr-summary"
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Musobaqa xulosasi…"
            />
          </div>

          <div className="competres-input-group">
            <label htmlFor="cr-suggestions">Takliflar</label>
            <textarea
              id="cr-suggestions"
              rows={4}
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              placeholder="Taklif va tavsiyalar…"
            />
          </div>

          <div className="competres-input-group">
            <label>Natija fayli</label>
            <div className="competres-file-row">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <button type="button" className="competres-file-btn" onClick={handlePickFile}>
                <FaFileCirclePlus /> Fayl tanlash
              </button>
              <span className="competres-file-name">
                {file?.name ||
                  (initialData?.result_file ? "Oldingi fayl mavjud" : "Fayl tanlanmagan")}
              </span>
            </div>
          </div>

          <div className="competres-modal-buttons">
            <button type="submit" className="competres-submit">
               Saqlash
            </button>
            <button type="button" className="competres-cancel" onClick={onClose}>
              Bekor qilish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompetitionResultModal;
