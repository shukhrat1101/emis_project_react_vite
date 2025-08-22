// src/components/Modals/Unit/PartModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import "./UnitModal.scss";
import "../Modal.scss";
import shtatService, { ShtatSelectItem } from "../../../services/shtatService";

type SelectOption = { value: string | number; label: string };

interface PartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: { name: string; type: string | number; shtat: string | number }) => void;
  initialData?: {
    id?: number;
    name: string;
    type: string | number;
    shtat: string | number;
  };
}

const PartModal: React.FC<PartModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [name, setName] = useState("");
  const [typeOpt, setTypeOpt] = useState<SelectOption | null>(null);
  const [shtatOpt, setShtatOpt] = useState<SelectOption | null>(null);

  const [degreeOptions, setDegreeOptions] = useState<SelectOption[]>([]);
  const [allShtats, setAllShtats] = useState<ShtatSelectItem[]>([]);

  // Helpers
  const norm = (v: unknown) => String(v ?? "").toLowerCase();

  // Load degrees + raw shtats when modal opens
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const degrees = await shtatService.getDegrees();
      setDegreeOptions(degrees);

      const raw = await shtatService.getSelect();
      setAllShtats(raw);
    })();
  }, [isOpen]);

  const filteredShtatOptions: SelectOption[] = useMemo(() => {
    if (!typeOpt) return [];
    const want = norm(typeOpt.value);
    return (allShtats || [])
      .filter((s) => norm(s.degree) === want)
      .map((s) => {
        const summary = (s.contingent_tables || [])
          .map((t) => `${t.type}: ${t.count_person}`)
          .join(", ");
        return {
          value: s.id,
          label: summary ? `${s.degree} — ${summary}` : s.degree,
        };
      });
  }, [typeOpt, allShtats]);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setName(initialData.name);

      const wantType = norm(initialData.type);
      const byValue = degreeOptions.find((d) => norm(d.value) === wantType) || null;
      const byLabel = degreeOptions.find((d) => norm(d.label) === wantType) || null;
      const chosen = byValue || byLabel;
      setTypeOpt(chosen ? { value: chosen.value, label: chosen.label } : null);
    } else {
      setName("");
      setTypeOpt(null);
      setShtatOpt(null);
    }
  }, [isOpen, initialData, degreeOptions]);

  useEffect(() => {
    if (!initialData) return;
    if (!typeOpt) {
      setShtatOpt(null);
      return;
    }
    const found =
      filteredShtatOptions.find((opt) => String(opt.value) === String(initialData.shtat)) || null;
    setShtatOpt(found);
  }, [initialData, typeOpt, filteredShtatOptions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !typeOpt || !shtatOpt) {
      alert("Barcha maydonlarni to‘ldiring!");
      return;
    }
    onSubmit({
      name,
      type: typeOpt.value,
      shtat: shtatOpt.value,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="add-edit-modal-overlay" onClick={onClose}>
      <div className="add-edit-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{initialData ? "Tahrirlash" : "Bo‘linma qo‘shish"}</h3>
        <form onSubmit={handleSubmit} className="form">
          <label>Bo‘linma nomi</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>Daraja turi</label>
          <Select
            options={degreeOptions}
            value={typeOpt}
            onChange={(opt) => {
              setTypeOpt(opt as SelectOption | null);
              setShtatOpt(null);
            }}
            placeholder="Daraja turini tanlang"
            isClearable
            className="react-select-container"
            classNamePrefix="react-select"
          />

          <label>Shtat</label>
          <Select
            options={filteredShtatOptions}
            value={shtatOpt}
            onChange={(opt) => setShtatOpt(opt as SelectOption | null)}
            placeholder="Shtatni tanlang"
            isClearable
            isDisabled={!typeOpt}
            className="react-select-container"
            classNamePrefix="react-select"
            noOptionsMessage={() => "Hech narsa topilmadi"}
          />

          <div className="modal-buttons">
            <button type="submit" className="submit">
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

export default PartModal;
