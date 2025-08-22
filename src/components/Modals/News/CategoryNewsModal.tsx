// src/components/Modals/News/CategoryNewsModal.tsx
import React, { useEffect, useRef, useState } from "react";
import "../Rank/RankModal.scss";
import "../Modal.scss";

type CategoryInitial = {
  id?: number;
  name?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData, id?: number) => void | Promise<void>;
  initialData?: CategoryInitial;
};

const CategoryNewsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(initialData?.name ?? "");
    setSubmitting(false);
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const fd = new FormData();
    fd.append("name", trimmed);

    setSubmitting(true);
    try {
      await onSubmit(fd, initialData?.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rank-modal-overlay">
      <div className="rank-modal">
        <h3>{initialData?.id ? "Kategoriyani tahrirlash" : "Kategoriya qo‘shish"}</h3>

        <form onSubmit={handleSubmit} className="form">
          <label>Kategoriya nomi</label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masalan: O'zbekiston"
            required
            autoComplete="off"
            maxLength={120}
          />

          <div className="rank-modal-buttons">
            <button type="submit" className="submit" disabled={submitting || !name.trim()}>
              {initialData?.id ? "Saqlash" : "Qo‘shish"}
            </button>
            <button type="button" className="cancel" onClick={onClose} disabled={submitting}>
              Bekor qilish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryNewsModal;
