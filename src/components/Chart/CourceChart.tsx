// src/components/Chart/CourceChart.tsx
import React, { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import {
    fetchCoursesByDepartment,
    type CourseDepartment,
} from "../../services/dashboardService";

type Props = {
    height?: number;
    onBarClick?: (row: CourseDepartment) => void;
};

const PALETTE = ["#2FAE9A", "#1F8A70", "#3E7BC4", "#1D4ED8", "#F2A74B", "#E76F51"];

function truncateLabel(s: string, max = 20) {
    const t = (s || "").trim();
    return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

const CourceChart: React.FC<Props> = ({ height = 320, onBarClick }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<echarts.ECharts | null>(null);

    const [rows, setRows] = useState<CourseDepartment[]>([]);
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
        fetchCoursesByDepartment(ac.signal)
            .then((data) => {
                const sorted = [...(data ?? [])].sort(
                    (a, b) => (b?.serviceman_count ?? 0) - (a?.serviceman_count ?? 0)
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

        const names = rows.map((r) => r.department_name);
        const counts = rows.map((r) => r.serviceman_count);

        inst.setOption(
            {
                tooltip: {
                    trigger: "item",
                    formatter: (p: any) => {
                        const r = rows[p.dataIndex];
                        return `<b>${r.department_name}</b><br/>Kurs tinglovchilari: ${r.serviceman_count}`;
                    },
                },
                grid: { left: 5, right: 32, top: 10, bottom: 10, containLabel: true },
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
                        barMaxWidth: 20,
                        emphasis: { focus: "series" },
                        label: { show: true, position: "right", color: "#0d1b2a", fontWeight: 700 , distance:4},
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
                            animation: "cource-spin 0.8s linear infinite",
                        }}
                    />
                </div>
            )}
            <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
            <style>{`
        @keyframes cource-spin { to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
};

export default CourceChart;
