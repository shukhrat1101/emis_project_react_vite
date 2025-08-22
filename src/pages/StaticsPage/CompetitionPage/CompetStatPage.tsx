import React, { useEffect, useState } from "react";
import { FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import competitionService, { Competition } from "../../../services/competitionService";
import Pagination from "../../../components/UI/Pagination";
import Loader from "../../../components/UI/Loader";
import SearchBar from "../../../components/UI/Search";
import CompFilter from "../../../components/UI/Filter/CompFilter";

import "../../InfoPages/CompetitionPage/CompetitionPage.scss";
import "../../../style/global.scss";

type TypeFilter = "Strategik" | "Operativ" | "";

const TOAST = {
    LOAD_ERR: "competitionstat-load-error",
};

function extractApiErrors(err: any): string[] {
    const msgs: string[] = [];
    const data = err?.response?.data;
    const collect = (v: any) => {
        if (v == null) return;
        if (typeof v === "string") msgs.push(v);
        else if (Array.isArray(v)) v.forEach(collect);
        else if (typeof v === "object") Object.values(v).forEach(collect);
    };
    if (data) collect(data);
    if (!msgs.length) msgs.push("Xatolik yuz berdi.");
    return msgs;
}

const CompetStatPage: React.FC = () => {
    const navigate = useNavigate();

    const [items, setItems] = useState<Competition[]>([]);
    const [total, setTotal] = useState(0);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState<{ type?: TypeFilter; year_id?: number | null; year?: string | null }>({
        type: "",
        year_id: null,
        year: null,
    });

    const fetchList = async () => {
        try {
            setLoading(true);
            const res = await (competitionService as any).list({
                page,
                page_size: pageSize,
                search,
                type: filters.type || undefined,
                year: filters.year ? filters.year.replace("–", "-") : undefined,
            });
            setItems(res?.results || []);
            setTotal(res?.total || 0);
        } catch (e: any) {
            const errs = extractApiErrors(e);
            errs.forEach((m, i) => toast.error(m, { toastId: `${TOAST.LOAD_ERR}-${i}-${m}` }));
            setItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, [page, pageSize, search, filters]);

    const goParticipants = (id: number) => {
        navigate(`/konkurs/competitions/${id}/participants`);
    };

    const goResult = (id: number) => {
        navigate(`/konkurs/competitions/${id}/result`);
    };

    return (
        <div className="compet-page">
            <div className="header">
                <h2 className="title">Musobaqalar ro‘yxati</h2>
                <div
                    className="header-controls"
                    style={{
                        marginLeft: 4,
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                        maxWidth: "100%",
                    }}
                >
                    <CompFilter
                        value={filters}
                        onChange={(v) => {
                            setFilters(v);
                            setPage(1);
                        }}
                    />
                    <div style={{ flex: "0 1 320px", minWidth: 240, marginLeft: 24 }}>
                        <SearchBar
                            className="command-search"
                            placeholder="Qidiruv..."
                            initialValue={search}
                            onSearch={(q) => {
                                setSearch(q);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <Loader />
            ) : (
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                        <tr>
                            <th>T/R</th>
                            <th>Daraja turi</th>
                            <th>Mavzu</th>
                            <th>O‘tkazish joyi</th>
                            <th>Sana</th>
                            <th>O‘quv yili</th>
                            <th>Ishtirokchilar</th>
                            <th>Natija</th>
                        </tr>
                        </thead>
                        <tbody>
                        {Array.isArray(items) && items.length > 0 ? (
                            items.map((row, index) => (
                                <tr key={row.id}>
                                    <td>{(page - 1) * pageSize + index + 1}</td>
                                    <td>{row.type}</td>
                                    <td>{row.lesson}</td>
                                    <td>{row.competition_place}</td>
                                    <td>
                                        {row.start_date} / {row.end_date}
                                    </td>
                                    <td>{row.teaching_year ?? "—"}</td>
                                    <td className="participants-cell">
                                        <button
                                            className="btn detail"
                                            onClick={() => goParticipants(row.id)}
                                            title="Qatnashuvchilarni ko‘rish"
                                        >
                                            <FaEye /> Ishtirokchilar
                                        </button>
                                    </td>
                                    <td className="result-cell">
                                        <button
                                            className="btn detail"
                                            onClick={() => goResult(row.id)}
                                            title="Natijani ko‘rish"
                                        >
                                            <FaEye />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} style={{ textAlign: "center" }}>
                                    Maʼlumot topilmadi
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>

                    <Pagination
                        total={total}
                        page={page}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={(newSize) => {
                            setPageSize(newSize);
                            setPage(1);
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default CompetStatPage;
