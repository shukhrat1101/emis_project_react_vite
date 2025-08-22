import React, { useEffect, useState } from "react";
import Select from "react-select";
import "./PositionModal.scss";
import "../Modal.scss";
import rankService from "../../../services/rankService";

interface Position {
  id?: number;
  name: string;
  type: string;
  self_rank: number | string;
}

interface Option {
  value: string | number;
  label: string;
}

interface PositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  initialData?: Position;
}

const PositionModal: React.FC<PositionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [name, setName] = useState<string>("");
  const [type, setType] = useState<Option | null>(null);
  const [selfRank, setSelfRank] = useState<Option | null>(null);
  const [typeOptions, setTypeOptions] = useState<Option[]>([]);
  const [rankOptions, setRankOptions] = useState<Option[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const types = await rankService.getRankTypes();
        const ranks = await rankService.getRankSelect();
        setTypeOptions(types);
        setRankOptions(ranks);



        if (initialData) {
          setName(initialData.name || "");

          const selectedType = types.find(
            (opt) => opt.label === initialData.type
          );

          setType(selectedType || null);

          const selectedRank = ranks.find(
            (opt) => opt.label === initialData.self_rank
          );

          setSelfRank(selectedRank || null);
        } else {
          setName("");
          setType(null);
          setSelfRank(null);
        }

        setDataLoaded(true);
      } catch (error) {

      }
    };

    loadData();
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("type", type?.value.toString() || "");
    formData.append("self_rank", selfRank?.value.toString() || "");

    onSubmit(formData);
    onClose();
  };

  if (!isOpen || !dataLoaded) return null;

  return (
    <div className="p-modal-overlay">
      <div className="p-modal">
        <h3>{initialData ? "Lavozimni tahrirlash" : "Lavozim qo‘shish"}</h3>
        <form onSubmit={handleSubmit} className="form">
          <label>Lavozim nomi</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masalan: Bo'lim boshlig'i"
            required
          />

          <label>Turini tanlang</label>
          <Select
            className="react-select-container"
            classNamePrefix="react-select"
            options={typeOptions}
            value={type}
            onChange={(selected) => setType(selected)}
            placeholder="Tanlang"
            isClearable
          />

          <label>Unvon darajasi</label>
          <Select
            className="react-select-container"
            classNamePrefix="react-select"
            options={rankOptions}
            value={selfRank}
            onChange={(selected) => setSelfRank(selected)}
            placeholder="Tanlang"
            isClearable
          />

          <div className="p-modal-buttons">
            <button type="submit" className="submit">Saqlash</button>
            <button type="button" className="cancel" onClick={onClose}>
              Bekor qilish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PositionModal;
