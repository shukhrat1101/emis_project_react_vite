// src/components/Chart/CompetitionChart.tsx
import React, { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import {
    fetchCompetitionsByDepartment,
    type CompetitionDepartment,
} from "../../services/dashboardService";

type Props = {
    height?: number;
    onBarClick?: (row: CompetitionDepartment) => void;
};

const PALETTE = ["#2FAE9A", "#1F8A70", "#3E7BC4", "#1D4ED8", "#F2A74B", "#E76F51"];

function truncateLabel(s: string, max = 22) {
    const t = (s || "").trim();
    return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

const CompetitionChart: React.FC<Props> = ({ height = 320, onBarClick }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<echarts.ECharts | null>(null);

    const [rows, setRows] = useState<CompetitionDepartment[]>([]);
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
        fetchCompetitionsByDepartment(ac.signal)
            .then((data) => {
                const sorted = [...(data ?? [])].sort(
                    (a, b) => (b?.participant_count ?? 0) - (a?.participant_count ?? 0)
                );
                setRows(sorted);
            })
            .finally(() => setLoading(false));
        return () => ac.abort();
    }, []);

    useEffect(() => {
        const inst = chartRef.current;
        if (!inst) return;

        if (!rows.length) {
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

        const names = rows.map((r) => r.name);
        const counts = rows.map((r) => r.participant_count);


        inst.setOption(
            {
                tooltip: {
                    trigger: "item",
                    formatter: (p: any) => {
                        const r = rows[p.dataIndex];
                        return `<b>${r.name}</b><br/>Ishtirokchilar: ${r.participant_count}`;
                    },
                },
                grid: { left: 12, right: 32, top: 10, bottom: 10, containLabel: true },
                xAxis: {
                    type: "value",
                    splitLine: { show: true },
                    axisLabel: { color: "#233655" },
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
                        type: "bar",
                        data: counts.map((v, i) => ({
                            value: v,
                            itemStyle: { color: PALETTE[i % PALETTE.length] },
                        })),
                        barMaxWidth: 22,
                        emphasis: { focus: "series" },
                        label: { show: true, position: "right", color: "#0d1b2a", fontWeight: 700 },
                        animationDuration: 300,
                    },
                ],
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
                            animation: "competition-spin 0.8s linear infinite",
                        }}
                    />
                </div>
            )}
            <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
            <style>{`
        @keyframes competition-spin { to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
};

export default CompetitionChart;
