// src/components/Chart/DistrictShtatChart.tsx
import React, { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import {
    fetchDistrictShtats,
    type DistrictShtat,
} from "../../services/dashboardService";

type Props = {
    height?: number;
    onBarClick?: (row: DistrictShtat) => void;
};

const COLOR_BIO = "#2FAE9A";
const COLOR_VAC = "#F2A74B";

function truncateLabel(s: string, max = 22) {
    const t = (s || "").trim();
    return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

const DistrictShtatChart: React.FC<Props> = ({ height = 360, onBarClick }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<echarts.ECharts | null>(null);

    const [rows, setRows] = useState<DistrictShtat[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;
        const inst = echarts.init(containerRef.current);
        chartRef.current = inst;

        const handleClick = (params: any) => {
            if (!onBarClick) return;
            const idx = params?.dataIndex;
            if (typeof idx === "number" && rows[idx]) onBarClick(rows[idx]);
        };
        inst.on("click", handleClick);

        const ro = new ResizeObserver(() => inst.resize());
        ro.observe(containerRef.current);

        return () => {
            inst.off("click", handleClick);
            ro.disconnect();
            inst.dispose();
            chartRef.current = null;
        };
    }, [onBarClick, rows]);

    useEffect(() => {
        const ac = new AbortController();
        setLoading(true);
        fetchDistrictShtats(ac.signal)
            .then((data) => {
                const sorted = [...(data ?? [])].sort(
                    (a, b) => (b?.count_person_total ?? 0) - (a?.count_person_total ?? 0)
                );
                setRows(sorted);
            })
            .finally(() => setLoading(false));
        return () => ac.abort();
    }, []);

    useEffect(() => {
        const inst = chartRef.current;
        if (!inst) return;

        if (!rows.length || rows.every(r => (r.count_person_total ?? 0) === 0)) {
            inst.clear();
            inst.setOption({
                title: {
                    text: "Ma’lumot topilmadi",
                    left: "center",
                    top: "middle",
                    textStyle: { color: "#233655", fontSize: 14, fontWeight: 600 },
                },
            });
            return;
        }

        const names = rows.map(r => r.name);
        const bio = rows.map(r => r.biografic_data_count ?? 0);
        const vac = rows.map(r => r.vacants ?? 0);
        const totals = rows.map(r => r.count_person_total ?? 0);

        inst.setOption(
            {
                tooltip: {
                    trigger: "axis",
                    axisPointer: { type: "shadow" },
                    formatter: (params: any) => {
                        const idx = params?.[0]?.dataIndex ?? 0;
                        const r = rows[idx];
                        return `
              <div style="min-width:220px">
                <b>${r.name}</b><br/>
                Jami: <b>${r.count_person_total}</b><br/>
                Xodim: <span style="color:${COLOR_BIO}">${r.biografic_data_count}</span><br/>
                Vakant: <span style="color:${COLOR_VAC}">${r.vacants}</span>
              </div>
            `;
                    },
                },
                legend: {
                    data: ["Xodim", "Vakant"],
                    top: 0,
                },
                grid: { left: 12, right: 30, top: 36, bottom: 10, containLabel: true },
                xAxis: {
                    type: "value",
                    axisLabel: { color: "#233655" },
                    splitLine: { show: true },
                },
                yAxis: {
                    type: "category",
                    data: names,
                    axisLabel: {
                        color: "#233655",
                        formatter: (val: string) => truncateLabel(val),
                    },
                },
                series: [
                    {
                        name: "Xodim",
                        type: "bar",
                        stack: "total",
                        data: bio,
                        barMaxWidth: 22,
                        itemStyle: { color: COLOR_BIO },
                        label: { show: true, position: "insideLeft", color: "#0d1b2a", formatter: ({ value }: any) => (value ? value : "") },
                        emphasis: { focus: "series" },
                    },
                    {
                        name: "Vakant",
                        type: "bar",
                        stack: "total",
                        data: vac,
                        barMaxWidth: 22,
                        itemStyle: { color: COLOR_VAC },
                        label: { show: true, position: "insideRight", color: "#0d1b2a", formatter: ({ value }: any) => (value ? value : "") },
                        emphasis: { focus: "series" },
                    },
                    {
                        name: "Jami",
                        type: "bar",
                        stack: "total",
                        data: totals.map(() => 0),
                        barMaxWidth: 22,
                        itemStyle: { color: "transparent" },
                        label: {
                            show: true,
                            position: "right",
                            color: "#0d1b2a",
                            fontWeight: 700,
                            formatter: (p: any) => `${totals[p.dataIndex]}`,
                        },
                        tooltip: { show: false },
                        emphasis: { disabled: true },
                    },
                ],
                animationDuration: 300,
            },
            false
        );
    }, [rows]);

    return (
        <div style={{ width: "100%", height, position: "relative" }}>
            {loading && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        zIndex: 1,
                        background: "transparent",
                    }}
                >
                    <div
                        style={{
                            width: 36,
                            height: 36,
                            border: "3px solid rgba(35,54,85,0.18)",
                            borderTopColor: "#375483",
                            borderRadius: "50%",
                            animation: "district-spin 0.8s linear infinite",
                        }}
                    />
                </div>
            )}
            <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
            <style>{`@keyframes district-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default DistrictShtatChart;
