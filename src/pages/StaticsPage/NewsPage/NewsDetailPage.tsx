import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import newsService, { News, NewsImage } from "../../../services/newsService";
import Loader from "../../../components/UI/Loader";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./NewsDetailPage.scss";

const FALLBACK_IMAGE = "/news.png";

const pickUrl = (it: NewsImage): string =>
    typeof it === "string" ? it : it?.image || it?.url || "";

const fmtDT = (s?: string | null) => {
    if (!s) return "—";
    try {
        const d = new Date(s);
        const dd = d.toLocaleDateString("uz-UZ");
        const tt = d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
        return `${dd} / ${tt}`;
    } catch {
        return s as string;
    }
};

const AUTO_MS = 4000;
const SWIPE_THRESHOLD = 40;

const NewsDetailPage: React.FC = () => {
    const { id } = useParams();
    const [item, setItem] = useState<News | null>(null);
    const [loading, setLoading] = useState(false);
    const [idx, setIdx] = useState(0);
    const [hover, setHover] = useState(false);

    const timerRef = useRef<number | null>(null);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const touching = useRef(false);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const data = await newsService.retrieve(Number(id));
                setItem(data || null);
            } catch {
                setItem(null);
                toast.error("Ma'lumotni yuklashda xatolik");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const images = useMemo(() => {
        const arr: string[] = [];
        if (item?.main_image) arr.push(item.main_image);
        if (Array.isArray(item?.additional_images)) {
            item!.additional_images!.forEach((im) => {
                const u = pickUrl(im);
                if (u && !arr.includes(u)) arr.push(u);
            });
        }
        return arr.length ? arr : [FALLBACK_IMAGE];
    }, [item]);

    useEffect(() => {
        setIdx(0);
    }, [images.length]);

    const prev = () => setIdx((p) => (p - 1 + images.length) % images.length);
    const next = () => setIdx((p) => (p + 1) % images.length);
    const go = (i: number) => setIdx(((i % images.length) + images.length) % images.length);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") prev();
            else if (e.key === "ArrowRight") next();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [images.length]);

    useEffect(() => {
        if (images.length <= 1) return;
        if (hover) {
            if (timerRef.current) window.clearInterval(timerRef.current);
            timerRef.current = null;
            return;
        }
        timerRef.current = window.setInterval(next, AUTO_MS);
        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current);
            timerRef.current = null;
        };
    }, [images.length, hover]);

    const onTouchStart = (e: React.TouchEvent) => {
        touching.current = true;
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };
    const onTouchMove = (e: React.TouchEvent) => {
        if (!touching.current) return;
        const dx = e.touches[0].clientX - touchStartX.current;
        const dy = e.touches[0].clientY - touchStartY.current;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
            touching.current = false;
            if (dx > 0) prev();
            else next();
        }
    };
    const onTouchEnd = () => {
        touching.current = false;
    };

    if (loading) return <Loader />;

    if (!item)
        return (
            <div className="newsdetail notfound">
                Ma'lumot topilmadi
            </div>
        );

    return (
        <div className="newsdetail">
            <div
                className="newsdetail-hero"
                role="region"
                aria-label="Rasmlar slayderi"
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            >
                <button
                    className="hero-nav hero-nav--left"
                    onClick={prev}
                    aria-label="Oldingi rasm"
                    disabled={images.length <= 1}
                >
                    ‹
                </button>

                <div
                    className="hero-frame"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <img src={images[idx]} alt={item.title || "news"} />
                </div>

                <button
                    className="hero-nav hero-nav--right"
                    onClick={next}
                    aria-label="Keyingi rasm"
                    disabled={images.length <= 1}
                >
                    ›
                </button>
            </div>

            {images.length > 1 && (
                <>
                    <div className="hero-dots" role="tablist" aria-label="Slayder ko‘rsatkichlari">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                className={`hero-dot ${i === idx ? "is-active" : ""}`}
                                onClick={() => go(i)}
                                role="tab"
                                aria-selected={i === idx}
                                aria-label={`Rasm ${i + 1}`}
                            />
                        ))}
                    </div>

                    <div className="hero-thumbs" aria-label="Rasmlar kichik ko‘rinishi">
                        {images.map((src, i) => (
                            <button
                                key={i}
                                className={`thumb ${i === idx ? "is-active" : ""}`}
                                onClick={() => go(i)}
                                title={`Rasm ${i + 1}`}
                            >
                                <img src={src} alt={`thumb-${i + 1}`} loading="lazy" />
                            </button>
                        ))}
                    </div>
                </>
            )}

            <h1 className="newsdetail-title">{item.title}</h1>

            <div className="newsdetail-meta">
                <span className="badge">{item.category_name || "Kategoriya"}</span>
                <span className="date">{fmtDT(item.created_at)}</span>
            </div>

            <div className="newsdetail-content">
                {String(item.content || "")
                    .split(/\n{2,}/)
                    .map((p, i) => (
                        <p key={i}>{p}</p>
                    ))}
            </div>

            {item.journal_file && (
                <a className="newsdetail-file" href={item.journal_file} target="_blank" rel="noreferrer">
                    Hujjatni ochish
                </a>
            )}
            {(item as any).journal_file_url && !item.journal_file && (
                <a className="newsdetail-file" href={(item as any).journal_file_url} target="_blank" rel="noreferrer">
                    Hujjatni ochish
                </a>
            )}
        </div>
    );
};

export default NewsDetailPage;
