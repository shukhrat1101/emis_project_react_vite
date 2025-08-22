import React, { useEffect, useState } from "react";
import { FaEye, FaFilePdf } from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Pagination from "../../../components/UI/Pagination";
import Loader from "../../../components/UI/Loader";
import "react-toastify/dist/ReactToastify.css";
import "../../InfoPages/TeachingPage/TeachingPage.scss";
import "../../../style/global.scss";
import researchTeachGetService, { TeachingItem } from "../../../services/researchTeachGetService";
import SearchBar from "../../../components/UI/Search";
import TeachFilter from "../../../components/UI/Filter/TeachFilter";

type DegreeFilter = "Strategik" | "Operativ" | "Taktik" | "";

const MAX_LESSON_CHARS = 40;

const TOAST = {
    LOAD_ERR: "researchstat-load-error",
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

function fileNameFromUrl(url: string) {
    try {
        const u = new URL(url);
        const last = u.pathname.split("/").pop() || "file";
        return decodeURIComponent(last);
    } catch {
        return "file";
    }
}

const ResearchStatPage: React.FC = () => {
    const [items, setItems] = useState<TeachingItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(false);
    const [expandedLessonId, setExpandedLessonId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState<{ degree?: DegreeFilter; year_id?: number | null; year?: string | null }>({
        degree: "",
        year_id: null,
        year: null,
    });

    const navigate = useNavigate();

    const fetchList = async () => {
        try {
            setLoading(true);
            const res = await researchTeachGetService.listResearch({
                page,
                page_size: pageSize,
                search,
                degree: filters.degree || undefined,
                year: filters.year ? filters.year.replace("–", "-") : undefined,
            });
            setItems(res.results || []);
            setTotal(res.total || 0);
        } catch (error: any) {
            setItems([]);
            setTotal(0);
            extractApiErrors(error).forEach((m, i) =>
                toast.error(m, { toastId: `${TOAST.LOAD_ERR}-${i}-${m}` })
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, [page, pageSize, search, filters]);

    const handleViewDivisions = (id: number) => {
        navigate(`/oquv-tadqiqotlar/${id}/bolinmalar`);
    };

    const handleViewResults = (id: number) => {
        navigate(`/oquv-tadqiqotlar/${id}/natija`);
    };

    const toggleLesson = (id: number) => {
        setExpandedLessonId((prev) => (prev === id ? null : id));
    };

    const renderLessonCell = (row: TeachingItem) => {
        const text = row.lesson ?? "";
        const isLong = text.length > MAX_LESSON_CHARS;
        const isExpanded = expandedLessonId === row.id;
        if (!isLong) return text;
        if (isExpanded) {
            return (
                <span>
          {text}{" "}
                    <button
                        className="link-like-btn"
                        onClick={() => toggleLesson(row.id)}
                        aria-label="Yopish"
                        title="Yopish"
                    >
            ...
          </button>
        </span>
            );
        }
        const short = text.slice(0, MAX_LESSON_CHARS);
        return (
            <span>
        {short}
                <span>… </span>
        <button
            className="link-like-btn"
            onClick={() => toggleLesson(row.id)}
            aria-label="To‘liq ko‘rish"
            title="To‘liq ko‘rish"
        >
          batafsil
        </button>
      </span>
        );
    };

    return (
        <div className="teach-year-page">
            <div className="header">
                <h2 className="title">Tadqiqotlar ro‘yxati</h2>
                <div
                    className="header-controls"
                    style={{
                        marginLeft: "auto",
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                        maxWidth: "100%",
                    }}
                >
                    <TeachFilter
                        value={filters}
                        onChange={(v) => {
                            setFilters(v);
                            setPage(1);
                        }}
                    />
                    <div style={{ flex: "0 1 320px", minWidth: 240, marginLeft:8 }}>
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
                            <th>Darajasi</th>
                            <th>Mavzusi</th>
                            <th>Rahbar</th>
                            <th>O‘tkazish joyi</th>
                            <th>Boshlanish va tugash sanasi</th>
                            <th>O‘quv yili</th>
                            <th>Reja</th>
                            <th>Yaratuvchi</th>
                            <th>Bo‘linma / Natija</th>
                        </tr>
                        </thead>
                        <tbody>
                        {Array.isArray(items) && items.length > 0 ? (
                            items.map((row, index) => (
                                <tr key={row.id}>
                                    <td>{(page - 1) * pageSize + index + 1}</td>
                                    <td>{row.degree}</td>
                                    <td>{renderLessonCell(row)}</td>
                                    <td>{row.leader}</td>
                                    <td>{row.teaching_place}</td>
                                    <td>
                                        {row.start_date} / {row.end_date}
                                    </td>
                                    <td>{row.teaching_year}</td>
                                    <td>
                                        {row.plan ? (
                                            <a
                                                href={row.plan}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title={fileNameFromUrl(row.plan)}
                                                download={fileNameFromUrl(row.plan)}
                                                className="file-link"
                                            >
                                                <FaFilePdf size={24} style={{ color: "#dc9a37" }} />
                                            </a>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td>{row.created_by}</td>
                                    <td>
                                        <button
                                            className="btn detail"
                                            onClick={() => handleViewDivisions(row.id)}
                                            title="Bo‘linmalarni ko‘rish"
                                        >
                                            <FaEye />
                                        </button>
                                        <button
                                            className="btn detail1"
                                            onClick={() => handleViewResults(row.id)}
                                            title="Natijalarni ko‘rish"
                                        >
                                            <FaEye />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={11} style={{ textAlign: "center" }}>
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

export default ResearchStatPage;
