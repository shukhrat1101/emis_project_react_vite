// src/components/Chart/TeachingPieEcharts.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import {
    fetchTeachingStatistics,
    type TeachingType,
    type Degree,
    toPieDataFromDegreeOrdered,
} from "../../services/dashboardService";

type Props = {
    teachingType: TeachingType;
    teachingYear: number | string;
    selectedDegree?: Degree;
    onSliceClick?: (degree: Degree) => void;
};

const COLORS: Record<string, string> = {
    Strategik: "#38A89D",
    Operativ: "#4C8CCD",
    Taktik: "#F3B35E",
};
const FALLBACK = "#4C8CCD";
const labelToDegree: Record<string, Degree> = {
    Strategik: "strategik",
    Operativ: "operativ",
    Taktik: "taktik",
};

export default function TeachingPieEcharts({
                                               teachingType,
                                               teachingYear,
                                               selectedDegree,
                                               onSliceClick,
                                           }: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<echarts.ECharts | null>(null);
    const onSliceClickRef = useRef<typeof onSliceClick>(onSliceClick);

    useEffect(() => {
        onSliceClickRef.current = onSliceClick;
    }, [onSliceClick]);

    const [raw, setRaw] = useState<{ name: string; value: number }[]>([]);
    const [branchCounts, setBranchCounts] = useState({ mv: 0, kt: 0, xd: 0 });

    useEffect(() => {
        let on = true;
        (async () => {
            const res = await fetchTeachingStatistics(teachingType, teachingYear);
            if (!on) return;
            const ordered = toPieDataFromDegreeOrdered(res.degree_stats);
            setRaw(ordered);
            const mv = res.branch_type_stats.find((b) => b.branch_type === "mv")?.count ?? 0;
            const kt = res.branch_type_stats.find((b) => b.branch_type === "kt")?.count ?? 0;
            const xd = res.branch_type_stats.find((b) => b.branch_type === "xd")?.count ?? 0;
            setBranchCounts({ mv, kt, xd });
        })();
        return () => {
            on = false;
        };
    }, [teachingType, teachingYear]);

    const data = useMemo(() => raw.filter((d) => d && typeof d.value === "number"), [raw]);

    useEffect(() => {
        if (!containerRef.current) return;
        const inst = echarts.init(containerRef.current);
        chartRef.current = inst;

        const clickHandler = (params: any) => {
            if (params?.seriesType !== "pie") return;
            const name = String(params.name);
            const deg = labelToDegree[name];
            const cb = onSliceClickRef.current;
            if (deg && cb) cb(deg);
        };
        inst.on("click", clickHandler);

        const ro = new ResizeObserver(() => inst.resize());
        ro.observe(containerRef.current);

        return () => {
            inst.off("click", clickHandler);
            ro.disconnect();
            inst.dispose();
            chartRef.current = null;
        };
    }, []);

    useEffect(() => {
        const inst = chartRef.current;
        if (!inst) return;

        const seriesData = data.map((d) => ({
            name: d.name,
            value: d.value,
            itemStyle: { color: COLORS[d.name] ?? FALLBACK },
        }));

        const legendData = data.map((d) => d.name);

        const option: echarts.EChartsOption = {
            tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
            legend: { bottom: 5, left: "center", data: legendData },
            series: [
                {
                    type: "pie",
                    radius: "65%",
                    center: ["50%", "45%"],
                    selectedMode: "single",
                    stillShowZeroSum: true,
                    label: { show: true, formatter: "{b}: {d}%" },
                    labelLine: { show: true },
                    data: seriesData,
                    emphasis: {
                        itemStyle: { shadowBlur: 2, shadowOffsetX: 0, shadowColor: "rgba(0,0,0,0.35)" },
                    },
                },
            ],
            animationDurationUpdate: 200,
        };

        inst.setOption(option);
    }, [data, selectedDegree]);

    return (
        <div className="tp-root">
            <div className="summary-list">
                <div className="summary-item">
                    <span>Kuch tuzilmalar</span>
                    <b>{branchCounts.kt}</b>
                </div>
                <div className="summary-item">
                    <span>Mudofaa vazirligi</span>
                    <b>{branchCounts.mv}</b>
                </div>
                <div className="summary-item">
                    <span>Xorijiy davlatlar</span>
                    <b>{branchCounts.xd}</b>
                </div>
            </div>
            <div className="chart-wrap" tabIndex={-1}>
                <div ref={containerRef} style={{ width: "100%", height: "90%" }} />
            </div>
        </div>
    );
}
