// src/components/Modals/Command/CommandModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaFileCirclePlus } from "react-icons/fa6";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Modal.scss";
import "./CommandModal.scss";

export interface CommandInitial {
  id?: number;
  name?: string;
  number?: string;
  created_at?: string;
  author?: string;
  command_url?: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void | Promise<void>;
  initialData?: CommandInitial;
}

const CommandModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const isEdit = useMemo(() => Boolean(initialData?.id), [initialData?.id]);

  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [date, setDate] = useState("");
  const [author, setAuthor] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(initialData?.name ?? "");
    setNumber(initialData?.number ?? "");
    setDate(initialData?.created_at ?? "");
    setAuthor(initialData?.author ?? "");
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
    if (!name.trim()) return toast.warning("Hujjat nomini kiriting.");
    if (!number.trim()) return toast.warning("Hujjat raqamini kiriting.");
    if (!date) return toast.warning("Sana tanlang.");
    if (!author.trim()) return toast.warning("Muallifni kiriting.");

    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("number", number.trim());
    fd.append("created_at", date);
    fd.append("author", author.trim());
    if (file) fd.append("command_url", file);

    onSubmit(fd);
  };

  return (
    <div className="command-modal-overlay">
      <div className="command-modal">
        <h3>{isEdit ? "Buyruqni tahrirlash" : "Buyruq qo‘shish"}</h3>

        <form className="form" onSubmit={handleSubmit}>
          <div className="command-input-group">
            <label htmlFor="cmd-name">Hujjat nomi</label>
            <input
              id="cmd-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: ... to‘g‘risida"
              required
            />
          </div>

          <div className="command-input-group">
            <label htmlFor="cmd-number">Hujjat raqami</label>
            <input
              id="cmd-number"
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Masalan: MV 1085"
              required
            />
          </div>

          <div className="command-input-group">
            <label htmlFor="cmd-date">Sana</label>
            <input
              id="cmd-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="command-input-group">
            <label htmlFor="cmd-author">Muallif</label>
            <input
              id="cmd-author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Masalan: Mudofaa vaziri"
              required
            />
          </div>

          <div className="command-input-group">
            <label>Fayl</label>
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
                {file?.name ||
                  (initialData?.command_url ? "Oldingi fayl mavjud" : "Fayl tanlanmagan")}
              </span>
            </div>
          </div>

          <div className="command-modal-buttons">
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

export default CommandModal;
