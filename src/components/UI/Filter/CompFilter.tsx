import React, { useEffect, useMemo, useState } from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import "./TeachFilter.scss";
import teachYearService from "../../../services/teachYearService";

type TypeFilter = "Strategik" | "Operativ" | "";

type Option = { value: number | string; label: string };

type Props = {
    value?: { type?: TypeFilter; year_id?: number | null; year?: string | null };
    onChange: (v: { type?: TypeFilter; year_id?: number | null; year?: string | null }) => void;
    className?: string;
    disabled?: boolean;
};

const TYPE_OPTIONS: Option[] = [
    { value: "strategik", label: "Strategik" },
    { value: "operativ", label: "Operativ" },
];

const selectStyles: StylesConfig<Option, false> = {
    control: (base, state) => ({
        ...base,
        minHeight: 40,
        height: 40,
        backgroundColor: "#fff",
        borderColor: state.isFocused ? "#395977" : "#d1d5db",
        boxShadow: state.isFocused ? "0 0 0 2px rgba(37,99,235,.15)" : "none",
        borderRadius: 8,
        paddingLeft: 2,
        ":hover": { borderColor: state.isFocused ? "#395977" : "#cbd5e1" },
    }),
    valueContainer: (base) => ({ ...base, padding: "0 12px" }),
    input: (base) => ({ ...base, margin: 0, padding: 0 }),
    indicatorsContainer: (base) => ({ ...base, height: 40 }),
    indicatorSeparator: () => ({ display: "none" }),
    placeholder: (base) => ({ ...base, color: "#9ca3af" }),
    singleValue: (base) => ({ ...base, color: "#111827" }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? "#395977" : state.isFocused ? "#eef2ff" : "#fff",
        color: state.isSelected ? "#fff" : "#111827",
        ":active": { backgroundColor: state.isSelected ? "#2c4963" : "#e5e7eb" },
    }),
    menu: (base) => ({ ...base, borderRadius: 8, overflow: "hidden", zIndex: 20 }),
};

const CompFilter: React.FC<Props> = ({ value, onChange, className = "", disabled }) => {
    const [yearOptions, setYearOptions] = useState<Option[]>([]);
    const [loadingYears, setLoadingYears] = useState(false);

    const typeVal = value?.type ?? "";
    const yearId = value?.year_id ?? null;

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoadingYears(true);
            try {
                const opts = await (teachYearService as any).getSelectOptions();
                if (!alive) return;
                setYearOptions(opts);
            } finally {
                if (alive) setLoadingYears(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const typeValue: Option | null = useMemo(
        () => (typeVal ? TYPE_OPTIONS.find((o) => o.value === typeVal) ?? null : null),
        [typeVal]
    );

    const yearValue: Option | null = useMemo(
        () => (yearId == null ? null : yearOptions.find((o) => o.value === yearId) ?? null),
        [yearId, yearOptions]
    );

    const onTypeChange = (opt: SingleValue<Option>) => {
        const t = (opt?.value as TypeFilter) ?? "";
        onChange({ type: t, year_id: yearId, year: value?.year ?? null });
    };

    const onYearChange = (opt: SingleValue<Option>) => {
        const id = (opt?.value as number) ?? null;
        const label = opt?.label ?? null;
        onChange({ type: typeVal, year_id: id, year: label });
    };

    return (
        <div className={`teach-filter ${className}`}>
            <div className="tf-field">
                <Select
                    inputId="type-select"
                    classNamePrefix="rs"
                    styles={selectStyles}
                    options={TYPE_OPTIONS}
                    value={typeValue}
                    placeholder="Turini tanlang"
                    isClearable
                    isDisabled={disabled}
                    isSearchable={false}
                    onChange={onTypeChange}
                />
            </div>

            <div className="tf-field">
                <Select
                    inputId="year-select"
                    classNamePrefix="rs"
                    styles={selectStyles}
                    options={yearOptions}
                    value={yearValue}
                    placeholder="O‘quv yilini tanlang"
                    isClearable
                    isDisabled={disabled || loadingYears}
                    onChange={onYearChange}
                />
            </div>
        </div>
    );
};

export default CompFilter;
