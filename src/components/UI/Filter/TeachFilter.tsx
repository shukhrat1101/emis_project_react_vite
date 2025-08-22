import React, { useEffect, useMemo, useState } from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import "./TeachFilter.scss";
import teachYearService from "../../../services/teachYearService";

export type Degree = "Strategik" | "Operativ" | "Taktik" | "";

type Option = { value: number | string; label: string };

type Props = {
    value?: { degree?: Degree; year_id?: number | null; year?: string | null };
    onChange: (v: { degree?: Degree; year_id?: number | null; year?: string | null }) => void;
    className?: string;
    disabled?: boolean;
};

const DEGREE_OPTIONS: Option[] = [
    { value: "Strategik", label: "Strategik" },
    { value: "Operativ", label: "Operativ" },
    { value: "Taktik", label: "Taktik" },
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

const TeachFilter: React.FC<Props> = ({ value, onChange, className = "", disabled }) => {
    const [yearOptions, setYearOptions] = useState<Option[]>([]);
    const [loadingYears, setLoadingYears] = useState(false);

    const degreeVal = value?.degree ?? "";
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

    const degreeValue: Option | null = useMemo(
        () => (degreeVal ? DEGREE_OPTIONS.find((o) => o.value === degreeVal) ?? null : null),
        [degreeVal]
    );

    const yearValue: Option | null = useMemo(
        () => (yearId == null ? null : yearOptions.find((o) => o.value === yearId) ?? null),
        [yearId, yearOptions]
    );

    const onDegreeChange = (opt: SingleValue<Option>) => {
        const d = (opt?.value as Degree) ?? "";
        onChange({ degree: d, year_id: yearId, year: value?.year ?? null });
    };

    const onYearChange = (opt: SingleValue<Option>) => {
        const id = (opt?.value as number) ?? null;
        const label = opt?.label ?? null;
        onChange({ degree: degreeVal, year_id: id, year: label });
    };

    return (
        <div className={`teach-filter ${className}`}>
            <div className="tf-field">
                <Select
                    inputId="degree-select"
                    classNamePrefix="rs"
                    styles={selectStyles}
                    options={DEGREE_OPTIONS}
                    value={degreeValue}
                    placeholder="Darajani tanlang"
                    isClearable
                    isDisabled={disabled}
                    isSearchable={false}
                    onChange={onDegreeChange}
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

export default TeachFilter;
