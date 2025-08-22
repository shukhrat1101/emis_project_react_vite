import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import "./Dashboard.scss";
import Loader from "../../components/UI/Loader";
import teachYearService from "../../services/teachYearService";
import {
    fetchTeachingStatistics,
    type TeachingType,
    type Degree,
    DEGREE_LABEL,
    fetchDashboardCounts,
    type DashboardCounts,
} from "../../services/dashboardService";
import TeachingListTable from "../../components/Table/TeachingListTable";
import TeachingPieEcharts from "../../components/Chart/TeachingPie";
import {
    LuUsers,
    LuBriefcase,
    LuFileText,
    LuGraduationCap,
    LuTrophy,
    LuMonitor,
} from "react-icons/lu";

import CourceChart from "../../components/Chart/CourceChart";
import CompetitionChart from "../../components/Chart/CompetitionChart";
import DistrictShtatChart from "../../components/Chart/DistrictShtatChart";

type SelectOption = { value: number | string; label: string };
type IconType = React.ComponentType<{ size?: number; color?: string; className?: string }>;

const TYPE_OPTIONS: { label: string; value: TeachingType }[] = [
    { label: "O‘quv", value: "o'quv" },
    { label: "Tadqiqot", value: "tadqiqot" },
];

function hexToRgba(hex: string, alpha = 1) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const PALETTE = ["#41cfb9", "#0d5141", "#3E7BC4", "#1d3883", "#F2A74B", "#a8472f"];

async function pickDefaultYearWithData(type: TeachingType, options: SelectOption[]) {
    for (const opt of options) {
        try {
            const res = await fetchTeachingStatistics(type, opt.value);
            const total =
                (res.degree_stats?.reduce((a, b) => a + (b?.count ?? 0), 0) ?? 0) ||
                (res.branch_type_stats?.reduce((a, b) => a + (b?.count ?? 0), 0) ?? 0);
            if (total > 0) return opt;
        } catch {}
    }
    return options[0] ?? null;
}

const DashboardPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [yearOptions, setYearOptions] = useState<SelectOption[]>([]);
    const [year, setYear] = useState<SelectOption | null>(null);
    const [type, setType] = useState<{ label: string; value: TeachingType }>(TYPE_OPTIONS[0]);
    const [selectedDegree, setSelectedDegree] = useState<Degree>("strategik");
    const [listRefreshKey, setListRefreshKey] = useState(0);
    const [counts, setCounts] = useState<DashboardCounts | null>(null);

    const handleSliceClick = (deg: Degree) => {
        setSelectedDegree(prev => {
            if (prev === deg) setListRefreshKey(k => k + 1);
            return deg;
        });
    };

    const selectTheme = (theme: any) => ({
        ...theme,
        colors: {
            ...theme.colors,
            primary: "#233655",
            primary25: "rgba(11, 132, 255, 0.12)",
            primary50: "rgba(11, 132, 255, 0.24)",
            neutral20: "rgba(11, 132, 255, 0.40)",
            neutral30: "rgba(11, 132, 255, 0.40)",
        },
    });

    useEffect(() => {
        let active = true;
        (async () => {
            const opts = await teachYearService.getSelectOptions();
            if (!active) return;
            setYearOptions(opts);
            const def = await pickDefaultYearWithData(type.value, opts);
            if (!active) return;
            setYear(def);
            const c = await fetchDashboardCounts();
            if (!active) return;
            setCounts(c);
            setLoading(false);
        })();
        return () => { active = false; };
    }, []);

    useEffect(() => { setSelectedDegree("strategik"); }, [type, year]);

    const title = useMemo(
        () => (type.value === "o'quv" ? "O‘quvlar statistikasi" : "Tadqiqotlar statistikasi"),
        [type]
    );

    const tiles = useMemo(() => {
        const c = counts || ({} as DashboardCounts);
        return [
            { key: "total_biografic_data",     title: "Xodimlar",   Icon: LuUsers,          value: c.total_biografic_data ?? 0 },
            { key: "total_vacants",            title: "Vakansiyalar", Icon: LuBriefcase,    value: c.total_vacants ?? 0 },
            { key: "total_commands",           title: "Buyruqlar",  Icon: LuFileText,       value: c.total_commands ?? 0 },
            { key: "total_courses_count",      title: "Kurslar",    Icon: LuGraduationCap,  value: c.total_courses_count ?? 0 },
            { key: "total_competitions_count", title: "Musobaqalar", Icon: LuTrophy,        value: c.total_competitions_count ?? 0 },
            { key: "total_count_pc_jcats",     title: "PC/JCATS",   Icon: LuMonitor,        value: c.total_count_pc_jcats ?? 0 },
        ] as { key: string; title: string; Icon: IconType; value: number }[];
    }, [counts]);

    if (loading || !year) return <Loader />;

    return (
        <div className="dashboard">
            <div className="top">
                <div className="card" style={{ ["--card-h" as any]: "auto", backgroundColor: "inherit" }}>
                    <div className="card-body">
                        <div className="stats-grid stats-grid--top">
                            {tiles.map((t, i) => {
                                const color = PALETTE[i % PALETTE.length];
                                const Icon = t.Icon;
                                return (
                                    <div
                                        key={t.key}
                                        className="stat-card"
                                        style={{
                                            background: "rgba(229, 239, 244, 0.57)",
                                            border: `1px solid ${hexToRgba("#233655", 0.08)}`,
                                        }}
                                    >
                                        <div
                                            className="stat-avatar"
                                            style={{
                                                background: hexToRgba(color, 0.15),
                                                boxShadow: `0 2px 8px ${hexToRgba(color, 0.20)}`,
                                            }}
                                        >
                                            <Icon size={26} color={color} />
                                        </div>
                                        <div className="stat-meta">
                                            <div className="stat-title">{t.title}</div>
                                            <div className="stat-count" style={{ color }}>{t.value}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bl">
                <div className="card" style={{ ["--card-h" as any]: "400px" }}>
                    <div className="card-header">
                        <h3>{title}</h3>
                        <div className="card-controls">
                            <Select
                                options={yearOptions}
                                value={year}
                                onChange={(v) => v && setYear(v)}
                                isSearchable
                                classNamePrefix="rs"
                                placeholder="O‘quv yili"
                                theme={selectTheme}
                                maxMenuHeight={160}
                                className="rs-field border-bold"
                            />
                            <Select
                                options={TYPE_OPTIONS}
                                value={type}
                                onChange={(v) => v && setType(v)}
                                classNamePrefix="rs"
                                placeholder="Tur"
                                theme={selectTheme}
                                maxMenuHeight={160}
                            />
                        </div>
                    </div>
                    <div className="card-body" style={{ overflow: "hidden" }}>
                        <TeachingPieEcharts
                            teachingType={type.value}
                            teachingYear={year.value}
                            selectedDegree={selectedDegree}
                            onSliceClick={handleSliceClick}
                        />
                    </div>
                </div>
            </div>

            <div className="br">
                <div className="card" style={{ ["--card-h" as any]: "400px" }}>
                    <div className="card-body">
                        <h3 style={{ marginTop: 2 }}>
                            {DEGREE_LABEL[selectedDegree]} {(type.value === "o'quv" ? "o‘quvlar" : "tadqiqotlar")} — {year.label}
                        </h3>
                        <div style={{ marginTop: 4 }}>
                            <TeachingListTable
                                key={`${type.value}-${year.value}-${selectedDegree}-${listRefreshKey}`}
                                type={type.value}
                                year={year.value}
                                yearLabel={String(year.label)}
                                degree={selectedDegree}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bottom-row">
                <div className="card" style={{ ["--card-h" as any]: "360px" }}>
                    <div className="card-header"><h3>Kurslar tinglovchilari</h3></div>
                    <div className="card-body" style={{ overflow: "hidden" }}>
                        <CourceChart height={300} />
                    </div>
                </div>
                <div className="card" style={{ ["--card-h" as any]: "360px" }}>
                    <div className="card-header"><h3>Musobaqa ishtirokchilari</h3></div>
                    <div className="card-body" style={{ overflow: "hidden" }}>
                        <CompetitionChart height={300} />
                    </div>
                </div>
                <div className="card" style={{ ["--card-h" as any]: "360px" }}>
                    <div className="card-header"><h3>Shtat tarkibi</h3></div>
                    <div className="card-body" style={{ overflow: "hidden" }}>
                        <DistrictShtatChart height={300} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
