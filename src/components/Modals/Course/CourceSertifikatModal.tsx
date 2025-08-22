// src/components/Modals/Course/CourceSertifikatModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaSave } from "react-icons/fa";
import { PiCertificateFill } from "react-icons/pi";
import "../Modal.scss";
import "./CourceSertifikatModal.scss";

export type CourceSertifikatInitial = {
  id?: number;
  sertification_number?: string;
  sertification_url?: string;
  issued_at?: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fd: FormData) => void | Promise<void>;
  enrollmentId: number;
  initialData?: CourceSertifikatInitial;
}

const CourceSertifikatModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  enrollmentId,
  initialData,
}) => {
  const isEdit = useMemo(() => Boolean(initialData?.id), [initialData?.id]);

  const [number, setNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (!isOpen) return;
    setNumber(initialData?.sertification_number ?? "");
    setFile(null);
    setSubmitting(false);
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const clearSelectedFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();

    if (!isEdit) {
      fd.set("enrollment", String(enrollmentId));
      fd.set("issued_at", todayStr);
    }
    if (number.trim()) fd.set("sertification_number", number.trim());
    if (file) fd.set("sertification_url", file);

    setSubmitting(true);
    try {
      await onSubmit(fd);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedFileName = file?.name || "";

  return (
    <div className="cs-modal-overlay">
      <div className="cs-modal">
        <h3 className="cs-title">{isEdit ? "Sertifikatni tahrirlash" : "Sertifikat qo‘shish"}</h3>

        <form className="cs-form" onSubmit={handleSubmit}>
          <div className="cs-input-group">
            <label htmlFor="cs-number">Sertifikat raqami</label>
            <input
              id="cs-number"
              type="text"
              placeholder="Masalan: 0000012"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
            />
          </div>

          <div className="cs-input-group">
            <label>Fayl (PDF)</label>

            <input
              ref={fileInputRef}
              id="cs-file"
              type="file"
              accept=".pdf"
              onChange={handleFile}
              style={{ display: "none" }}
            />

            <div className="cs-filebar" role="group" aria-label="Fayl yuklash boshqaruvlari">
              <button
                type="button"
                className="cs-file-btn"
                onClick={openFileDialog}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openFileDialog()}
              >
                <PiCertificateFill />
              </button>

              <span className="cs-file-name">
                {selectedFileName
                  ? selectedFileName
                  : initialData?.sertification_url
                  ? "Joriy fayl tanlangan (o‘zgartirish uchun ustidagi tugmani bosing)"
                  : "Fayl tanlanmagan"}
              </span>

              {selectedFileName && (
                <button type="button" className="cs-file-clear" onClick={clearSelectedFile}>
                  Tozalash
                </button>
              )}
            </div>

            {isEdit && initialData?.sertification_url && !selectedFileName && (
              <div className="cs-hint">
                Joriy fayl:{" "}
                <a href={initialData.sertification_url} target="_blank" rel="noopener noreferrer">
                  ochish
                </a>
              </div>
            )}
          </div>

          <div className="cs-buttons">
            <button type="submit" className="cs-submit" disabled={submitting}>
               Saqlash
            </button>
            <button type="button" className="cs-cancel" onClick={onClose} disabled={submitting}>
              Bekor qilish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourceSertifikatModal;
