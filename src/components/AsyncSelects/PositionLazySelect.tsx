// src/components/AsyncSelects/PositionLazySelect.tsx
import React, { useEffect, useMemo, useState } from "react";
import Select, { SingleValue, components } from "react-select";
import positionService, { RawListItem } from "../../services/positionService";

export type Option = { value: string; label: string };

type Props = {
    value: Option | null;
    onChange: (v: Option | null) => void;
    placeholder?: string;
    pageSize?: number;
    disabled?: boolean;
    autoFocus?: boolean;
};

const PositionLazySelect: React.FC<Props> = ({
                                                 value,
                                                 onChange,
                                                 placeholder = "Lavozim tanlang",
                                                 pageSize = 10,
                                                 disabled,
                                                 autoFocus,
                                             }) => {
    const [opts, setOpts] = useState<Option[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    // qidiruv
    const [query, setQuery] = useState("");
    const q = useDebounce(query, 300);

    const hasMore = useMemo(() => {
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        return page < totalPages;
    }, [total, page, pageSize]);

    const fetchPage = async (p: number, qstr: string) => {
        setLoading(true);
        try {
            const res = await positionService.getAll(p, pageSize, qstr);
            const newItems =
                (res.results || []).map< Option>((r: RawListItem) => ({
                    value: String(r.id),
                    label: r.name,
                }));
            setTotal(res.total || 0);
            setPage(res.page || p);

            setOpts((prev) =>
                p === 1 ? newItems : dedupeByValue([...prev, ...newItems])
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!menuOpen) return;
        fetchPage(1, q);
    }, [menuOpen, q, pageSize]);

    return (
        <Select<Option, false>
            classNamePrefix="react-select"
            isDisabled={disabled}
            autoFocus={autoFocus}
            value={value}
            options={opts}
            placeholder={placeholder}
            isClearable
            isLoading={loading}
            onChange={(opt: SingleValue<Option>) => onChange(opt ?? null)}
            onMenuOpen={() => setMenuOpen(true)}
            onMenuClose={() => setMenuOpen(false)}
            onInputChange={(input, meta) => {
                if (meta.action === "input-change") {
                    setQuery(input);
                }
            }}
            onMenuScrollToBottom={() => {
                if (loading || !hasMore) return;
                fetchPage(page + 1, q);
            }}
            noOptionsMessage={() => (loading ? "Yuklanmoqda..." : "Topilmadi")}
            components={{
                MenuList: (props) => (
                    <components.MenuList {...props}>
                        {props.children}
                        {loading && (
                            <div style={{ padding: 8, textAlign: "center", fontSize: 12 }}>
                                Yuklanmoqda...
                            </div>
                        )}
                    </components.MenuList>
                ),
            }}
        />
    );
};

export default PositionLazySelect;

function dedupeByValue(arr: Option[]): Option[] {
    const m = new Map<string, Option>();
    arr.forEach((o) => m.set(o.value, o));
    return Array.from(m.values());
}
function useDebounce<T>(val: T, ms = 300): T {
    const [v, setV] = useState(val);
    useEffect(() => {
        const t = setTimeout(() => setV(val), ms);
        return () => clearTimeout(t);
    }, [val, ms]);
    return v;
}
