// src/components/AsyncSelects/PartUnitLazySelect.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Select, { GroupBase, Props as SelectProps } from "react-select";
import partOfUnitService from "../../services/partofunitService";


export type Option = { value: string; label: string };

type Props = {
    value: Option | null;
    onChange: (v: Option | null) => void;
    placeholder?: string;
    isClearable?: boolean;
    departmentId?: number | string;
    pageSize?: number;
    disabled?: boolean;
    classNamePrefix?: string;
    menuPlacement?: SelectProps<Option, false, GroupBase<Option>>["menuPlacement"];
    menuPortalTarget?: HTMLElement | null;
};

const useDebounced = (val: string, delay = 350) => {
    const [d, setD] = useState(val);
    useEffect(() => {
        const t = setTimeout(() => setD(val), delay);
        return () => clearTimeout(t);
    }, [val, delay]);
    return d;
};

const PartUnitLazySelect: React.FC<Props> = ({
                                                 value,
                                                 onChange,
                                                 placeholder = "Bo‘limni tanlang",
                                                 isClearable = true,
                                                 departmentId,
                                                 pageSize = 20,
                                                 disabled,
                                                 classNamePrefix = "react-select",
                                                 menuPlacement,
                                                 menuPortalTarget,
                                             }) => {
    const [options, setOptions] = useState<Option[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [opened, setOpened] = useState(false);

    const [input, setInput] = useState("");
    const q = useDebounced(input, 350);
    const fetchingRef = useRef(false);

    const mapToOption = (r: { id: number; name: string; department: string }) => ({
        value: String(r.id),
        label: `${r.name} — ${r.department}`,
    });

    const fetchPage = async (pg: number, reset = false) => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        try {
            setLoading(true);
            const res = await partOfUnitService.select({
                page: pg,
                page_size: pageSize,
                search: q || undefined,
                department: departmentId,
            });
            const next = (res.results || []).map(mapToOption);
            setOptions((prev) => (reset ? next : [...prev, ...next]));
            setHasMore(pg * pageSize < (res.total || 0));
            setPage(pg);
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    };

    useEffect(() => {
        if (!opened) return;
        if (!options.length) fetchPage(1, true);
    }, [opened]);

    useEffect(() => {
        if (!opened) return;
        setHasMore(true);
        fetchPage(1, true);
    }, [q, departmentId]);

    const handleScrollToBottom: NonNullable<
        SelectProps<Option, false, GroupBase<Option>>["onMenuScrollToBottom"]
    > = () => {
        if (loading || !hasMore) return;
        fetchPage(page + 1);
    };

    const mergedOptions = useMemo(() => {
        if (value && !options.some((o) => o.value === value.value)) {
            return [value, ...options];
        }
        return options;
    }, [options, value]);

    return (
        <Select<Option, false>
            classNamePrefix={classNamePrefix}
            isDisabled={disabled}
            value={value}
            onChange={(v) => onChange((v as Option) || null)}
            options={mergedOptions}
            placeholder={placeholder}
            isClearable={isClearable}
            onInputChange={(val, meta) => {
                if (meta.action === "input-change") setInput(val);
            }}
            onMenuOpen={() => setOpened(true)}
            onMenuScrollToBottom={handleScrollToBottom}
            isLoading={loading}
            loadingMessage={() => "Yuklanmoqda..."}
            noOptionsMessage={() => (q ? "Hech narsa topilmadi" : "Ma’lumot yo‘q")}
            menuPlacement={menuPlacement}
            menuPortalTarget={menuPortalTarget}
        />
    );
};

export default PartUnitLazySelect;
