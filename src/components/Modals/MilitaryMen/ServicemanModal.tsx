// src/components/Modals/Serviceman/ServicemanModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Select, { SingleValue } from "react-select";
import { toast } from "react-toastify";
import { FaIdCard } from "react-icons/fa6";

import servicemanService, { ServicemanPayload } from "../../../services/servicemanService";
import partOfUnitService from "../../../services/partofunitService";
import rankService from "../../../services/rankService";

import "../Modal.scss";
import "./ServicemanModal.scss";

export type Option = { value: number; label: string };

export interface ServicemanInitial {
  id?: number;
  full_name?: string;
  position?: string;
  pinfl?: string;
  rankId?: number;
  unitId?: number;
  rankName?: string;
  unitName?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ServicemanPayload) => void | Promise<void>;
  initialData?: ServicemanInitial;
  rankOptions?: Option[];
  unitOptions?: Option[];
  lockPinfl?: boolean;
}

const PAGE_SIZE = 10;
const SENTINEL_ID = -1;

const ServicemanModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  rankOptions: seedRanks = [],
  unitOptions: seedUnits = [],
  lockPinfl = false,
}) => {
  const isEdit = useMemo(() => Boolean(initialData?.id), [initialData?.id]);

  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [pinfl, setPinfl] = useState("");

  const [rankOptions, setRankOptions] = useState<Option[]>([]);
  const [rankValue, setRankValue] = useState<Option | null>(null);
  const [rankPage, setRankPage] = useState(1);
  const [rankHasMore, setRankHasMore] = useState(true);
  const [rankLoading, setRankLoading] = useState(false);
  const [rankSearch, setRankSearch] = useState("");
  const [pendingRankLabel, setPendingRankLabel] = useState<string>("");

  const rankSearchTimer = useRef<number | undefined>(undefined);

  const [unitOptions, setUnitOptions] = useState<Option[]>([]);
  const [unitValue, setUnitValue] = useState<Option | null>(null);
  const [unitPage, setUnitPage] = useState(1);
  const [unitHasMore, setUnitHasMore] = useState(true);
  const [unitLoading, setUnitLoading] = useState(false);
  const [unitSearch, setUnitSearch] = useState("");
  const [pendingUnitLabel, setPendingUnitLabel] = useState<string>("");

  const unitSearchTimer = useRef<number | undefined>(undefined);

  const [checking, setChecking] = useState(false);
  const [pinflExists, setPinflExists] = useState<boolean>(false);
  const [pinflMsg, setPinflMsg] = useState<string | undefined>(undefined);
  const pinflDebounceTimer = useRef<number | undefined>(undefined);

  const uniq = (arr: Option[]) => {
    const m = new Map<number, Option>();
    arr.forEach((o) => m.set(o.value, o));
    return [...m.values()];
  };

  const base = (s: string) => s.toLowerCase().trim().split(" - ")[0];

  const loadRanks = async (nextPage = 1, search = "") => {
    if (rankLoading) return;
    setRankLoading(true);
    try {
      const res: any = await (rankService as any).getAll(nextPage, PAGE_SIZE);
      let list = res?.results ?? [];
      if (search) {
        const q = search.toLowerCase();
        list = list.filter((r: any) => String(r.name).toLowerCase().includes(q));
      }
      const opts: Option[] = list.map((r: any) => ({ value: r.id, label: r.name }));
      setRankOptions((prev) => uniq(nextPage === 1 ? opts : [...prev, ...opts]));
      setRankPage(nextPage);
      const total = res?.total ?? opts.length;
      setRankHasMore(nextPage * PAGE_SIZE < total);
    } finally {
      setRankLoading(false);
    }
  };

  const loadUnits = async (nextPage = 1, search = "") => {
    if (unitLoading) return;
    setUnitLoading(true);
    try {
      const res = await partOfUnitService.select({
        page: nextPage,
        page_size: PAGE_SIZE,
        search: search || undefined,
      });
      const opts: Option[] = (res?.results ?? []).map((u: any) => ({
        value: u.id,
        label: u.department ? `${u.name} - ${u.department}` : u.name,
      }));
      setUnitOptions((prev) => uniq(nextPage === 1 ? opts : [...prev, ...opts]));
      setUnitPage(nextPage);
      const total = res?.total ?? opts.length;
      setUnitHasMore(nextPage * PAGE_SIZE < total);
    } finally {
      setUnitLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    setFullName(initialData?.full_name ?? "");
    setPosition(initialData?.position ?? "");
    setPinfl(initialData?.pinfl ?? "");

    setRankOptions(seedRanks || []);
    setUnitOptions(seedUnits || []);
    setRankPage(1);
    setUnitPage(1);
    setRankHasMore(true);
    setUnitHasMore(true);

    setRankSearch("");
    setUnitSearch("");

    setChecking(false);
    setPinflExists(false);
    setPinflMsg(undefined);

    const preRank =
      initialData?.rankId
        ? { value: initialData.rankId, label: initialData.rankName ?? `#${initialData.rankId}` }
        : initialData?.rankName
        ? { value: SENTINEL_ID, label: initialData.rankName }
        : null;

    const preUnit =
      initialData?.unitId
        ? { value: initialData.unitId, label: initialData.unitName ?? `#${initialData.unitId}` }
        : initialData?.unitName
        ? { value: SENTINEL_ID, label: initialData.unitName }
        : null;

    setRankValue(preRank);
    setUnitValue(preUnit);

    setPendingRankLabel(preRank?.value === SENTINEL_ID ? preRank.label : "");
    setPendingUnitLabel(preUnit?.value === SENTINEL_ID ? preUnit.label : "");

    loadRanks(1, preRank?.value === SENTINEL_ID ? preRank.label : "");
    loadUnits(1, preUnit?.value === SENTINEL_ID ? preUnit.label : "");
  }, [isOpen]);

  useEffect(() => {
    if (!pendingRankLabel) return;
    if (!rankValue || rankValue.value === SENTINEL_ID) {
      const want = base(pendingRankLabel);
      const f =
        rankOptions.find((o) => base(o.label) === want) ||
        rankOptions.find((o) => base(o.label).includes(want)) ||
        null;
      if (f) {
        setRankValue(f);
        setPendingRankLabel("");
      } else if (rankHasMore && !rankLoading) {
        loadRanks(rankPage + 1, pendingRankLabel);
      }
    } else {
      setPendingRankLabel("");
    }
  }, [rankOptions, pendingRankLabel, rankHasMore, rankLoading, rankPage]);

  useEffect(() => {
    if (!pendingUnitLabel) return;
    if (!unitValue || unitValue.value === SENTINEL_ID) {
      const want = base(pendingUnitLabel);
      const f =
        unitOptions.find((o) => base(o.label) === want) ||
        unitOptions.find((o) => base(o.label).includes(want)) ||
        null;
      if (f) {
        setUnitValue(f);
        setPendingUnitLabel("");
      } else if (unitHasMore && !unitLoading) {
        loadUnits(unitPage + 1, pendingUnitLabel);
      }
    } else {
      setPendingUnitLabel("");
    }
  }, [unitOptions, pendingUnitLabel, unitHasMore, unitLoading, unitPage]);

  useEffect(() => {
    if (!isOpen) return;
    if (lockPinfl) return;
    window.clearTimeout(pinflDebounceTimer.current);
    if (!pinfl || pinfl.length !== 14) {
      setPinflExists(false);
      setPinflMsg(undefined);
      return;
    }
    pinflDebounceTimer.current = window.setTimeout(() => {
      runPinflCheck(pinfl);
    }, 350);
  }, [pinfl, lockPinfl, isOpen]);

  const runPinflCheck = async (val: string) => {
    if (!val || val.length !== 14) return;
    if (!servicemanService.isValidPinfl(val)) return;
    if (isEdit && val === (initialData?.pinfl || "")) {
      setPinflExists(false);
      setPinflMsg(undefined);
      return;
    }
    try {
      setChecking(true);
      const res: any = await servicemanService.checkPinfl(val);
      const exists = !!res?.exists;
      const msg = res?.detail || res?.message;
      setPinflExists(exists);
      setPinflMsg(msg);
      if (exists && !isEdit) {
        toast.warning(msg || "Bu JSHSHIR tizimda mavjud.");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "JSHSHIR tekshirishda xatolik.");
    } finally {
      setChecking(false);
    }
  };

  const validate = () => {
    if (!fullName.trim()) return toast.warning("To‘liq ismni kiriting.");
    if (fullName.trim().length < 3) return toast.warning("Ism kamida 3 belgi.");
    if (!position.trim()) return toast.warning("Lavozimni kiriting.");
    if (!rankValue) return toast.warning("Unvonni tanlang.");
    if (!unitValue) return toast.warning("Harbiy qismni tanlang.");
    if (rankValue.value === SENTINEL_ID) return toast.warning("Unvon ro‘yxatdan tanlanishi kerak.");
    if (unitValue.value === SENTINEL_ID) return toast.warning("Harbiy qism ro‘yxatdan tanlanishi kerak.");
    if (!pinfl) return toast.warning("JSHSHIR kiriting.");
    if (!servicemanService.isValidPinfl(pinfl)) return toast.error("JSHSHIR 14 ta raqam bo‘lishi kerak.");
    if (!isEdit && pinflExists) return toast.error(pinflMsg || "Bu JSHSHIR bilan xodim allaqachon mavjud.");
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload: ServicemanPayload = {
      rank: Number(rankValue!.value),
      full_name: fullName.trim(),
      position: position.trim(),
      military_unit: Number(unitValue!.value),
      pinfl: pinfl.trim(),
    };
    onSubmit(payload);
  };

  const onRankMenuOpen = () => {
    if (rankOptions.length === 0) loadRanks(1, rankSearch || pendingRankLabel);
  };
  const onRankMenuBottom = () => {
    if (rankHasMore && !rankLoading) loadRanks(rankPage + 1, rankSearch || pendingRankLabel);
  };
  const onRankInputChange = (value: string, { action }: any) => {
    if (action !== "input-change") return value;
    setRankSearch(value);
    window.clearTimeout(rankSearchTimer.current);
    rankSearchTimer.current = window.setTimeout(() => {
      setRankPage(1);
      setRankHasMore(true);
      loadRanks(1, value);
    }, 300);
    return value;
  };

  const onUnitMenuOpen = () => {
    if (unitOptions.length === 0) loadUnits(1, unitSearch || pendingUnitLabel);
  };
  const onUnitMenuBottom = () => {
    if (unitHasMore && !unitLoading) loadUnits(unitPage + 1, unitSearch || pendingUnitLabel);
  };
  const onUnitInputChange = (value: string, { action }: any) => {
    if (action !== "input-change") return value;
    setUnitSearch(value);
    window.clearTimeout(unitSearchTimer.current);
    unitSearchTimer.current = window.setTimeout(() => {
      setUnitPage(1);
      setUnitHasMore(true);
      loadUnits(1, value);
    }, 300);
    return value;
  };

  if (!isOpen) return null;

  const submitDisabled =
    checking ||
    !fullName.trim() ||
    !position.trim() ||
    !rankValue ||
    !unitValue ||
    rankValue.value === SENTINEL_ID ||
    unitValue.value === SENTINEL_ID ||
    !pinfl ||
    !servicemanService.isValidPinfl(pinfl) ||
    (!isEdit && pinflExists);

  return (
    <div className="men-modal-overlay">
      <div className="men-modal">
        <h3 className="men-title">{isEdit ? "Harbiy xizmatchi — tahrirlash" : "Harbiy xizmatchi — qo‘shish"}</h3>

        <form className="men-form" onSubmit={handleSubmit}>
          <div className="men-input-group">
            <label htmlFor="men-fullname">To‘liq ism</label>
            <input
              id="men-fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Masalan: Rashidov Qobil Komilovich"
              required
            />
          </div>

          <div className="men-input-group">
            <label htmlFor="men-position">Lavozim</label>
            <input
              id="men-position"
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Masalan: Guruh komandiri"
              required
            />
          </div>

          <div className="men-row">
            <div className="men-input-group">
              <label>Unvon</label>
              <Select
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Unvonni tanlang"
                isSearchable
                isLoading={rankLoading}
                options={rankOptions}
                value={rankValue}
                onChange={(v: SingleValue<Option>) => setRankValue(v ?? null)}
                onMenuOpen={onRankMenuOpen}
                onMenuScrollToBottom={onRankMenuBottom}
                onInputChange={onRankInputChange}
                filterOption={() => true}
                noOptionsMessage={() => (rankLoading ? "Yuklanmoqda..." : "Topilmadi")}
              />
            </div>

            <div className="men-input-group">
              <label>Harbiy qism</label>
              <Select
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Harbiy qismni tanlang"
                isSearchable
                isLoading={unitLoading}
                options={unitOptions}
                value={unitValue}
                onChange={(v: SingleValue<Option>) => setUnitValue(v ?? null)}
                onMenuOpen={onUnitMenuOpen}
                onMenuScrollToBottom={onUnitMenuBottom}
                onInputChange={onUnitInputChange}
                filterOption={() => true}
                noOptionsMessage={() => (unitLoading ? "Yuklanmoqda..." : "Topilmadi")}
              />
            </div>
          </div>

          <div className="men-input-group">
            <label htmlFor="men-pinfl">JSHSHIR (14 raqam)</label>
            <div className={`men-pinfl-row ${lockPinfl ? "is-readonly" : ""}`}>
              <div className="men-pinfl-input">
                <FaIdCard />
                <input
                  id="men-pinfl"
                  type="text"
                  inputMode="numeric"
                  value={pinfl}
                  onChange={(e) => !lockPinfl && setPinfl(e.target.value.replace(/\D/g, "").slice(0, 14))}
                  placeholder="11111111111111"
                  maxLength={14}
                  required
                  readOnly={lockPinfl}
                  aria-readonly={lockPinfl || undefined}
                />
              </div>
            </div>
            {pinflExists && !isEdit && <div className="men-hint men-hint-warn">{pinflMsg || "Ushbu JSHSHIR bilan xodim mavjud."}</div>}
          </div>

          <div className="men-modal-buttons">
            <button type="submit" className="men-submit" disabled={submitDisabled}>
              {isEdit ? "Saqlash" : "Qo‘shish"}
            </button>
            <button type="button" className="men-cancel" onClick={onClose}>
              Bekor qilish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServicemanModal;
