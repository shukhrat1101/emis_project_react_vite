// src/components/Table/TeachingListTable.tsx
import React, { useEffect, useRef, useState } from "react";
import {
    fetchTeachingList,
    type TeachingListItem,
    type TeachingType,
    type Degree,
} from "../../services/dashboardService";
import "./TeachingListTable.scss";

type Props = {
    type: TeachingType;
    year: number | string;
    yearLabel: string;
    degree: Degree;
};

function truncate(text: string | undefined | null, max: number) {
    const s = (text ?? "").trim();
    if (s.length <= max) return s || "-";
    return s.slice(0, Math.max(0, max - 1)) + "…";
}

export default function TeachingListTable({ type, year, yearLabel, degree }: Props) {
    const [rows, setRows] = useState<TeachingListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const reqIdRef = useRef(0);

    useEffect(() => {
        const myId = ++reqIdRef.current;
        setLoading(true);
        (async () => {
            try {
                const data = await fetchTeachingList({
                    teaching_type: type,
                    teaching_year: year,
                    degree,
                });
                if (myId === reqIdRef.current) setRows(data);
            } finally {
                if (myId === reqIdRef.current) setLoading(false);
            }
        })();
    }, [type, year, degree]);

    const td: React.CSSProperties = {
        padding: "8px 10px",
        borderBottom: "1px solid #f3f4f6",
        verticalAlign: "top",
        fontSize: "12px",
    };
    const th: React.CSSProperties = {
        textAlign: "left",
        padding: "8px 10px",
        borderBottom: "1px solid #e5e7eb",
        whiteSpace: "nowrap",
        background: "rgba(11,132,255,0.12)",
        fontSize: "13px",
    };

    return (
        <div className="tlt-root">
            {loading ? (
                <div className="tlt-center">
                    <div className="tlt-spinner" />
                </div>
            ) : rows.length === 0 ? (
                <div className="tlt-center">
                    <div className="tlt-empty">Ma’lumot topilmadi</div>
                </div>
            ) : (
                <div className="tlt-scroll">
                    <table className="tlt-table">
                        <thead>
                        <tr>
                            <th style={th} className="tlt-col--idx">T/R</th>
                            <th style={th} className="tlt-col--lesson">Mavzusi</th>
                            <th style={th} className="tlt-col--place">O‘tkazish joyi</th>
                            <th style={th} className="tlt-col--time">Vaqti</th>
                        </tr>
                        </thead>
                        <tbody>
                        {rows.map((r, i) => (
                            <tr key={r.id ?? i}>
                                <td style={td}>{i + 1}</td>
                                <td style={td} className="tlt-cell tlt-cell--lesson" title={r.lesson ?? "-"}>
                                    {truncate(r.lesson, 40)}
                                </td>
                                <td style={td} className="tlt-cell tlt-cell--place" title={r.teaching_place ?? "-"}>
                                    {truncate(r.teaching_place, 20)}
                                </td>
                                <td style={td} className="tlt-cell tlt-cell--time">
                                    {r.start_date || "-"} {r.end_date ? ` / ${r.end_date}` : ""}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
