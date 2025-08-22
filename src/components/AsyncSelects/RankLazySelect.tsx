// src/components/AsyncSelects/RankLazySelect.tsx
import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import Select, { SingleValue } from "react-select";
import rankService, { Rank } from "../../services/rankService";

export type Option = { value: string; label: string };
type Props = {
    value: Option | null;
    onChange: (v: Option | null) => void;
    placeholder?: string;
    pageSize?: number;
    isDisabled?: boolean;
    search?: string;
};

function useDebounce<T>(val: T, ms = 350): T {
    const [v, setV] = useState(val);
    useEffect(() => {
        const t = setTimeout(() => setV(val), ms);
        return () => clearTimeout(t);
    }, [val, ms]);
    return v;
}

function dedupeByValue(arr: Option[]): Option[] {
    const m = new Map<string, Option>();
    arr.forEach((o) => m.set(o.value, o));
    return Array.from(m.values());
}

const RankLazySelect: React.FC<Props> = ({
                                             value,
                                             onChange,
                                             placeholder = "Unvonni tanlang",
                                             pageSize = 20,
                                             isDisabled,
                                             search = "",
                                         }) => {
    const debouncedSearch = useDebounce(search, 350);

    const [menuOpen, setMenuOpen] = useState(false);
    const [opts, setOpts] = useState<Option[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const loadingRef = useRef(false);
    const lastKeyRef = useRef<string>("");

    const toOption = (r: Rank): Option => ({ value: String(r.id), label: r.name });

    const loadFirstPage = useCallback(async () => {
        if (loadingRef.current) return;
        loadingRef.current = true;

        const key = `p1|q=${debouncedSearch.trim()}`;
        lastKeyRef.current = key;

        try {
            const res = await rankService.getAll(1, pageSize, debouncedSearch.trim() || undefined);
            if (lastKeyRef.current !== key) return;

            const list = (res.results || []).map(toOption);
            setOpts(list);
            const total = (res as any).total ?? (res as any).count ?? 0;
            const more = Boolean((res as any).next) || (total > pageSize);
            setHasMore(more);
            setPage(more ? 2 : 1);
        } finally {
            loadingRef.current = false;
        }
    }, [debouncedSearch, pageSize]);

    const loadNextPage = useCallback(async () => {
        if (loadingRef.current || !hasMore) return;
        loadingRef.current = true;

        const curPage = page;
        const key = `p${curPage}|q=${debouncedSearch.trim()}`;
        lastKeyRef.current = key;

        try {
            const res = await rankService.getAll(curPage, pageSize, debouncedSearch.trim() || undefined);
            if (lastKeyRef.current !== key) return;

            const got = (res.results || []).map(toOption);
            setOpts(prev => dedupeByValue([...prev, ...got]));

            const total = (res as any).total ?? (res as any).count ?? 0;
            const taken = curPage * pageSize;
            const more = Boolean((res as any).next) || (taken < total);
            setHasMore(more);
            if (more) setPage(curPage + 1);
        } finally {
            loadingRef.current = false;
        }
    }, [debouncedSearch, hasMore, page, pageSize]);

    const handleMenuOpen = () => {
        setMenuOpen(true);
        if (opts.length === 0) loadFirstPage();
    };
    const handleMenuClose = () => setMenuOpen(false);

    const handleMenuScrollToBottom = () => {
        if (menuOpen) loadNextPage();
    };

    useEffect(() => {
        setOpts([]);
        setPage(1);
        setHasMore(true);
        if (menuOpen) loadFirstPage();
    }, [debouncedSearch]);

    return (
        <Select<Option, false>
            classNamePrefix="react-select"
            options={opts}
            value={value}
            onChange={(opt: SingleValue<Option>) => onChange(opt ?? null)}
            placeholder={placeholder}
            isDisabled={isDisabled}
            onMenuOpen={handleMenuOpen}
            onMenuClose={handleMenuClose}
            onMenuScrollToBottom={handleMenuScrollToBottom}
            isLoading={loadingRef.current}
            menuPortalTarget={document.body}
            styles={{
                menuPortal: base => ({ ...base, zIndex: 1001 }),
            }}
            noOptionsMessage={() =>
                loadingRef.current ? "Yuklanmoqda..." : (debouncedSearch ? "Mos topilmadi" : "Ma'lumot yo‘q")
            }
        />
    );
};

export default RankLazySelect;
