// src/pages/News/NewsStatPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import categoryNewsService from "../../../services/categoryNewsService";
import newsService, { News, ListParams } from "../../../services/newsService";
import Loader from "../../../components/UI/Loader";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./NewsStatPage.scss";
import {GrLinkNext, GrLinkPrevious} from "react-icons/gr";

type Category = { id: number; name: string };

const TOAST = { LOAD_ERR: "newsstat-load-error" };
const FALLBACK_IMAGE = "/news.jpg";
const PAGE_SIZE = 8;

function normalizeListResponse(res: any): { arr: News[]; tot: number } {
    if (Array.isArray(res)) return { arr: res, tot: res.length };
    const arr: News[] = Array.isArray(res?.results) ? res.results : [];
    const tot =
        typeof res?.total === "number"
            ? res.total
            : typeof res?.count === "number"
                ? res.count
                : arr.length;
    return { arr, tot };
}

const imgUrl = (it: any): string =>
    typeof it === "string" ? it : it?.image || it?.url || "";

const fmtDT = (s?: string | null) => {
    if (!s) return "—";
    try {
        const d = new Date(s);
        const dd = d.toLocaleDateString("uz-UZ");
        const tt = d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
        return `${dd} ${tt}`;
    } catch {
        return s;
    }
};

function buildPageBar(curr: number, total: number, edge = 2, around = 1): Array<number | "..."> {
    const keep = new Set<number>();
    for (let i = 1; i <= Math.min(edge, total); i++) keep.add(i);
    for (let i = Math.max(1, total - edge + 1); i <= total; i++) keep.add(i);
    for (let i = Math.max(1, curr - around); i <= Math.min(total, curr + around); i++) keep.add(i);
    if (curr <= edge + 2) for (let i = 1; i <= Math.min(edge + 2, total); i++) keep.add(i);
    if (curr >= total - edge - 1) for (let i = Math.max(1, total - edge - 1); i <= total; i++) keep.add(i);
    const arr = Array.from(keep).filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const out: Array<number | "..."> = [];
    for (let i = 0; i < arr.length; i++) {
        if (i > 0 && arr[i] - arr[i - 1] > 1) out.push("...");
        out.push(arr[i]);
    }
    return out;
}

const NewsStatPage: React.FC = () => {
    const navigate = useNavigate();

    const [tabs, setTabs] = useState<Category[]>([]);
    const [activeCat, setActiveCat] = useState<number | "all">("all");
    const [query, setQuery] = useState("");
    const [items, setItems] = useState<News[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const reqIdRef = useRef(0);

    useEffect(() => {
        (async () => {
            try {
                const cats = await categoryNewsService.list();
                setTabs(cats || []);
            } catch {
                setTabs([]);
            }
        })();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            const reqId = ++reqIdRef.current;
            try {
                setLoading(true);
                const params: ListParams = { page, page_size: PAGE_SIZE, search: query || undefined };
                let res: any;
                if (activeCat === "all") {
                    res = await newsService.list(params);
                } else {
                    res = await newsService.listByCategory(Number(activeCat), params);
                }
                if (reqId !== reqIdRef.current) return;
                const { arr, tot } = normalizeListResponse(res);
                setItems(arr);
                setTotal(tot || 0);
            } catch {
                if (reqId !== reqIdRef.current) return;
                setItems([]);
                setTotal(0);
                toast.error("Ma'lumotni yuklashda xatolik", { toastId: TOAST.LOAD_ERR });
            } finally {
                if (reqId === reqIdRef.current) setLoading(false);
            }
        };
        fetchData();
    }, [activeCat, page, query]);

    useEffect(() => {
        setPage(1);
    }, [activeCat, query]);

    const openDetail = (n: News) => {
        if (n?.id != null) navigate(`/yangiliklar/${n.id}`);
        else if (n?.journal_file) window.open(n.journal_file, "_blank");
    };

    const pagesBar = useMemo(() => buildPageBar(page, totalPages, 2, 1), [page, totalPages]);

    return (
        <div className="newsstat">
            <div className="newsstat-top">
                <div className="newsstat-tabs" role="tablist" aria-label="Kategoriyalar">
                    <button
                        className={`newsstat-tab ${activeCat === "all" ? "is-active" : ""}`}
                        onClick={() => setActiveCat("all")}
                        role="tab"
                    >
                        Barcha yangiliklar
                    </button>
                    {tabs.map((c) => (
                        <button
                            key={c.id}
                            className={`newsstat-tab ${activeCat === c.id ? "is-active" : ""}`}
                            onClick={() => setActiveCat(c.id)}
                            role="tab"
                        >
                            {c.name}
                        </button>
                    ))}
                </div>

                <div className="newsstat-actions">
                    <input
                        className="newsstat-search"
                        placeholder="Yangilik qidirish..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <Loader />
            ) : (
                <div className="newsstat-grid">
                    {items.length ? (
                        items.map((n, i) => {
                            const cover =
                                n.main_image ||
                                (Array.isArray(n.additional_images) && n.additional_images.length
                                    ? imgUrl(n.additional_images[0])
                                    : FALLBACK_IMAGE);
                            return (
                                <div
                                    className="newsstat-card"
                                    key={n.id ?? i}
                                    onClick={() => openDetail(n)}
                                    onKeyDown={(e) => e.key === "Enter" && openDetail(n)}
                                    role="button"
                                    tabIndex={0}
                                    title={n.title}
                                >
                                    <div className="newsstat-cover">
                                        <img src={cover || FALLBACK_IMAGE} alt={n.title || "news"} loading="lazy" />
                                    </div>
                                    <div className="newsstat-body">
                                        <div className="newsstat-meta">
                                            <span className="newsstat-badge">{n.category_name || "Kategoriya"}</span>
                                            <span className="newsstat-date">{fmtDT(n.created_at)}</span>
                                        </div>
                                        <h3 className="newsstat-title" title={n.title}>
                                            {n.title}
                                        </h3>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="newsstat-empty">Ma'lumot topilmadi</div>
                    )}
                </div>
            )}

            <nav className="newsstat-pager" aria-label="Sahifalash">
                <button
                    className="pager-btn"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                >
                    <GrLinkPrevious size={16}/>
                </button>
                {pagesBar.map((p, idx) =>
                        p === "..." ? (
                            <span key={`dots-${idx}`} className="pager-dots" aria-hidden>
              …
            </span>
                        ) : (
                            <button
                                key={p}
                                className={`pager-btn num ${p === page ? "is-active" : ""}`}
                                onClick={() => setPage(p as number)}
                                disabled={loading || p === page}
                                aria-current={p === page ? "page" : undefined}
                            >
                                {p}
                            </button>
                        )
                )}
                <button
                    className="pager-btn"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || loading}
                >
                    <GrLinkNext size={16} />
                </button>
            </nav>
        </div>
    );
};

export default NewsStatPage;
