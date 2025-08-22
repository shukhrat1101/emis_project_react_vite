// src/components/Modals/Competition/ParticipantModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FaIdCard } from "react-icons/fa";
import { IoMdAddCircle } from "react-icons/io";

import participantService from "../../../services/participantService";
import servicemanService, {
  ServicemanListItem,
  ServicemanPayload,
  isValidPinfl,
} from "../../../services/servicemanService";

import ServicemanModal from "../../../components/Modals/MilitaryMen/ServicemanModal";

import "../Modal.scss";
import "./ParticipantModal.scss";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  competitionId: number;
  onSaved?: () => void;
}

const ParticipantModal: React.FC<Props> = ({ isOpen, onClose, competitionId, onSaved }) => {
  const [pinfl, setPinfl] = useState("");
  const [checking, setChecking] = useState(false);

  const [exists, setExists] = useState<boolean | null>(null);
  const [hint, setHint] = useState<string | undefined>(undefined);

  const [servicemanId, setServicemanId] = useState<number | null>(null);
  const [fullName, setFullName] = useState<string>("");

  // Nested create-serviceman modal (PINFL locked)
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const canSave = useMemo(() => Boolean(exists && servicemanId), [exists, servicemanId]);

  useEffect(() => {
    if (!isOpen) return;
    setPinfl("");
    setChecking(false);
    setExists(null);
    setHint(undefined);
    setServicemanId(null);
    setFullName("");
    setIsCreateOpen(false);
  }, [isOpen]);

  const onPinflChange = (val: string) => {
    const onlyDigits = val.replace(/\D/g, "").slice(0, 14);
    setPinfl(onlyDigits);
    setExists(null);
    setHint(undefined);
    setServicemanId(null);
    setFullName("");
  };

  const fetchByPinfl = async (v: string): Promise<ServicemanListItem | undefined> => {
    try {
      const res = await servicemanService.list({ page: 1, page_size: 1, search: v });
      return res?.results?.[0];
    } catch {
      return undefined;
    }
  };

  const handleVerify = async () => {
    const v = pinfl.trim();
    if (!v) return toast.warning("JSHSHIR kiriting.");
    if (!isValidPinfl(v)) return toast.error("JSHSHIR 14 ta raqam bo‘lishi kerak.");

    try {
      setChecking(true);
      const res: any = await servicemanService.checkPinfl(v);
      const msg = res?.message || res?.detail;
      setHint(msg);
      setExists(!!res?.exists);

      if (res?.exists) {
        if (res?.serviceman?.id) {
          const sm = res.serviceman as ServicemanListItem;
          setServicemanId(sm.id);
          setFullName(sm.full_name || `ID: ${sm.id}`);
          toast.success(msg || "JSHSHIR topildi.");
          return;
        }
        if (res?.serviceman_id) {
          const sid = Number(res.serviceman_id);
          setServicemanId(sid);
          const item = await fetchByPinfl(v);
          setFullName(item?.full_name || `ID: ${sid}`);
          toast.success(msg || "JSHSHIR topildi.");
          return;
        }
        const item = await fetchByPinfl(v);
        if (item?.id) {
          setServicemanId(item.id);
          setFullName(item.full_name || `ID: ${item.id}`);
          toast.success(msg || "JSHSHIR topildi.");
        } else {
          setServicemanId(null);
          setFullName("");
          toast.warning("JSHSHIR topildi, lekin xodim maʼlumotlari olinmadi.");
        }
      } else {
        setServicemanId(null);
        setFullName("");
        toast.warning(msg || "Ushbu JSHSHIR bo‘yicha xodim topilmadi.");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "JSHSHIR tekshiruvda xatolik.");
    } finally {
      setChecking(false);
    }
  };

  const errToMessage = (e: any) => {
    const d = e?.response?.data;
    if (!d) return e?.message || "Saqlashda xatolik yuz berdi.";
    if (typeof d === "string") return d;
    if (Array.isArray(d)) return d.join(" ");
    if (Array.isArray(d?.non_field_errors)) return d.non_field_errors.join(" ");
    if (typeof d?.non_field_errors === "string") return d.non_field_errors;
    try {
      const parts: string[] = [];
      Object.entries(d).forEach(([_, v]) => {
        if (Array.isArray(v)) parts.push(v.join(" "));
        else if (typeof v === "string") parts.push(v);
      });
      if (parts.length) return parts.join(" ");
    } catch {}
    return d?.detail || d?.message || "Saqlashda xatolik yuz berdi.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return toast.warning("Avval JSHSHIR ni tasdiqlang.");
    try {
      await participantService.create({
        competition: competitionId,
        military_serviceman: Number(servicemanId),
      });
      toast.success("Ishtirokchi qo‘shildi!");
      onSaved?.();
      onClose();
    } catch (e: any) {
      toast.error(errToMessage(e));
    }
  };

  const handleCreateServiceman = async (payload: ServicemanPayload) => {
    try {
      const created = await servicemanService.create(payload);
      setServicemanId(created.id);
      setFullName(created.full_name);
      setExists(true);
      toast.success("Harbiy xizmatchi yaratildi!");
      setIsCreateOpen(false);
    } catch (e: any) {
      toast.error(errToMessage(e));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pp-modal-overlay">
      <div className="pp-modal">
        <h3 className="pp-title">Ishtirokchi qo‘shish</h3>

        <form className="pp-form" onSubmit={handleSubmit}>
          <div className="pp-input-group">
            <label htmlFor="pp-pinfl">JSHSHIR (14 raqam)</label>
            <div className="pp-pinfl-row">
              <div className="pp-pinfl-input">
                <FaIdCard />
                <input
                  id="pp-pinfl"
                  type="text"
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="11111111111111"
                  value={pinfl}
                  onChange={(e) => onPinflChange(e.target.value)}
                  required
                />
              </div>
              <button
                type="button"
                className="pp-verify-btn"
                onClick={handleVerify}
                disabled={checking || pinfl.length !== 14}
                title="JSHSHIR ni tasdiqlash"
              >
                {checking ? "..." : "Tasdiqlash"}
              </button>
            </div>

            {exists === true && (
              <div className="pp-hint pp-hint-ok">{hint || "Ushbu JSHSHIR tizimda mavjud."}</div>
            )}

            {exists === false && (
              <>
                <div className="pp-hint pp-hint-warn">
                  {hint || "Harbiy xizmatchi mavjud emas."}
                </div>
                <div className="pp-actions-inline">
                  <button
                    type="button"
                    className="pp-create-btn"
                    onClick={() => setIsCreateOpen(true)}
                  >
                    <IoMdAddCircle /> Harbiy xizmatchi qo‘shishni xohlaysizmi?
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="pp-input-group">
            <label>F.I.Sh</label>
            <input type="text" value={fullName} readOnly placeholder="—" />
          </div>

          <div className="pp-modal-buttons">
            <button type="submit" className="pp-submit" disabled={!canSave}>
               Saqlash
            </button>
            <button type="button" className="pp-cancel" onClick={onClose}>
              Bekor qilish
            </button>
          </div>
        </form>
      </div>

      <ServicemanModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateServiceman}
        initialData={{ pinfl }}
        lockPinfl
      />
    </div>
  );
};

export default ParticipantModal;
