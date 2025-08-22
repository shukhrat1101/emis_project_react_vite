// src/components/Modals/Teaching/TeachingBranchModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import teachingBranchService, {
  ChoiceOption,
  TeachingBranchPayload,
} from "../../../services/teachingBranchService";
import "./TeachingBranchModal.scss";
import "../Modal.scss";

export interface TeachingBranchInitial {
  id?: number;
  name?: string;
  branch_type?: string;
  military_count?: number;
  teaching?: number | string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: TeachingBranchPayload) => void | Promise<void>;
  initialData?: TeachingBranchInitial;
  teachingId?: number;
}

const TeachingBranchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  teachingId,
}) => {
  const [name, setName] = useState("");
  const [branchTypeOpt, setBranchTypeOpt] = useState<ChoiceOption | null>(null);
  const [branchTypeOptions, setBranchTypeOptions] = useState<ChoiceOption[]>([]);
  const [militaryCount, setMilitaryCount] = useState<number>(0);

  const isEdit = Boolean(initialData?.id);

  useEffect(() => {
    if (!isOpen) return;
    teachingBranchService.getBranchTypeOptions()
      .then(setBranchTypeOptions)
      .catch(() => setBranchTypeOptions([]));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    setName(initialData?.name ?? "");
    setMilitaryCount(
      typeof initialData?.military_count === "number" ? initialData!.military_count : 0
    );

    const from = initialData?.branch_type;
    if (from && branchTypeOptions.length) {
      const found =
        branchTypeOptions.find(o => o.value === from) ||
        branchTypeOptions.find(o => o.label === from);
      setBranchTypeOpt(found ?? null);
    } else {
      setBranchTypeOpt(null);
    }
  }, [isOpen, initialData, branchTypeOptions]);

  const effectiveTeachingId = useMemo(() => {
    const t = initialData?.teaching;
    if (typeof t === "number") return t;
    if (typeof t === "string" && !Number.isNaN(Number(t))) return Number(t);
    return teachingId;
  }, [initialData?.teaching, teachingId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return toast.warning("Jamoa nomini kiriting.");
    if (!branchTypeOpt) return toast.warning("Bo‘linma turini tanlang.");
    if (!Number.isFinite(militaryCount) || militaryCount < 0)
      return toast.warning("Harbiylar soni 0 yoki musbat bo‘lishi kerak.");
    if (!effectiveTeachingId)
      return toast.warning("O‘quv ID topilmadi. Bu bo‘linmani qaysi o‘quvga biriktirish kerakligini aniqlang.");

    const payload: TeachingBranchPayload = {
      name: name.trim(),
      branch_type: branchTypeOpt.value,
      military_count: Number(militaryCount),
      teaching: Number(effectiveTeachingId),
    };

    onSubmit(payload);
  };

  return (
    <div className="branch-modal-overlay">
      <div className="branch-modal">
        <h3>{isEdit ? "Jamoani tahrirlash" : "Jamoa qo‘shish"}</h3>

        <form className="form" onSubmit={handleSubmit}>
          <div className="branch-input-group">
            <label htmlFor="branch-name">Jamoa nomi</label>
            <input
              id="branch-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: MHO jamoasi"
              autoFocus
              required
            />
          </div>

          <div className="branch-input-group">
            <label>Darajasi</label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={branchTypeOptions}
              value={branchTypeOpt}
              onChange={(opt) => setBranchTypeOpt(opt as ChoiceOption)}
              placeholder="Tanlang"
              isClearable
            />
          </div>

          <div className="branch-input-group">
            <label htmlFor="branch-mc">Harbiylar soni</label>
            <input
              id="branch-mc"
              type="number"
              min={0}
              value={militaryCount}
              onChange={(e) => setMilitaryCount(Number(e.target.value))}
              placeholder="0"
              required
            />
          </div>

          {!effectiveTeachingId && (
            <div className="form-hint error">
              O‘quv ID aniqlanmadi. Bu modalni o‘quv kontekstida oching yoki <code>teachingId</code> yuboring.
            </div>
          )}

          <div className="branch-modal-buttons">
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

export default TeachingBranchModal;
