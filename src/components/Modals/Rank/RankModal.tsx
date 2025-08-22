import React, { useEffect, useState } from "react";
import Select from "react-select";
import rankService from "../../../services/rankService";
import "./RankModal.scss";
import "../Modal.scss";

interface Rank {
  id?: number;
  name: string;
  rank_type?: string;
}

interface RankOption {
  value: string | number;
  label: string;
}

interface RankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  initialData?: Rank;
}

const RankModal: React.FC<RankModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [name, setName] = useState("");
  const [rankType, setRankType] = useState<RankOption | null>(null);
  const [typeOptions, setTypeOptions] = useState<RankOption[]>([]);

  const fetchRankTypes = async () => {
    try {
      const data: RankOption[] = await rankService.getRankTypes();
      setTypeOptions(data);

      if (initialData?.rank_type) {
        const match = data.find((opt) => opt.label === initialData.rank_type);
        if (match) setRankType(match);
      }
    } catch (err) {
    }
  };

  useEffect(() => {
    setName(initialData?.name || "");
    setRankType(null);
    fetchRankTypes();
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    if (rankType) {
      formData.append("rank_type", String(rankType.value));
    }
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="rank-modal-overlay">
      <div className="rank-modal">
        <h3>{initialData ? "Unvonni tahrirlash" : "Unvon qo‘shish"}</h3>
        <form onSubmit={handleSubmit} className="form">
          <label>Unvon nomi</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masalan: Polkovnik"
            required
          />

          <label>Unvon turi</label>
          <Select
            options={typeOptions}
            value={rankType}
            onChange={(option: RankOption | null) => setRankType(option)}
            placeholder="Tanlang"
            isSearchable
            className="react-select-container"
            classNamePrefix="react-select"
          />

          <div className="rank-modal-buttons">
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

export default RankModal;
