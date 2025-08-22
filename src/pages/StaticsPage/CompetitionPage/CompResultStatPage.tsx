import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Loader from "../../../components/UI/Loader";
import competitionResultService, {
    CompetitionResult,
} from "../../../services/competitionResultService";

import "../../InfoPages/CompetitionPage/CompetitionResultPage.scss";
import "../../../style/global.scss";

const TOAST = {
    LOAD_ERR: "cresultstat-load-error",
};

const MAX_TITLE_CHARS = 60;
const truncate = (s: string, n = MAX_TITLE_CHARS) =>
    s && s.length > n ? s.slice(0, n) + "…" : s;

function extractFilename(url: string) {
    try {
        const u = new URL(url);
        const seg = u.pathname.split("/").filter(Boolean).pop() || "";
        return decodeURIComponent(seg);
    } catch {
        const seg = url.split("/").filter(Boolean).pop() || "";
        return decodeURIComponent(seg);
    }
}

function displayNameFromUrl(url?: string | null) {
    if (!url) return "—";
    const name = extractFilename(url);
    return name || "fayl";
}

const CompResultStatPage: React.FC = () => {
    const { id } = useParams();
    const competitionId = id ? Number(id) : undefined;

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CompetitionResult | null>(null);
    const [competitionName, setCompetitionName] = useState<string>("");

    const titleFull = competitionName || "";
    const titleShort = useMemo(() => truncate(titleFull), [titleFull]);
    const hasData = !!result;

    const load = async () => {
        if (!competitionId) return;
        try {
            setLoading(true);
            const list = await competitionResultService.listByCompetition(competitionId, {
                page: 1,
                page_size: 100,
            });
            const first = Array.isArray(list) ? list[0] : null;
            setResult(first ?? null);
            if (first?.competition) setCompetitionName(first.competition);
            else setCompetitionName("");
        } catch {
            toast.error("Natijalarni yuklashda xatolik!", { toastId: TOAST.LOAD_ERR });
            setResult(null);
            setCompetitionName("");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [competitionId]);

    return (
        <div className="competition-result-page">
            {hasData && (
                <div className="header">
                    <h2
                        className="title"
                        title={titleFull ? `Musobaqa: ${titleFull}` : undefined}
                    >
                        {titleFull ? titleShort : ""}
                    </h2>
                </div>
            )}

            {loading ? (
                <Loader />
            ) : !hasData ? (
                <div
                    className="empty-state"
                    style={{ minHeight: "48vh", display: "grid", placeItems: "center" }}
                >
                    <div className="empty-text">Natijalar mavjud emas!</div>
                </div>
            ) : (
                <div className="content">
                    <div className="cards">
                        <div className="card">
                            <div className="card-title">Xulosa:</div>
                            <div className="card-body">{result?.summary || "—"}</div>
                        </div>
                        <div className="card">
                            <div className="card-title">Taklif:</div>
                            <div className="card-body">{result?.suggestions || "—"}</div>
                        </div>
                    </div>

                    <div className="file-tile">
                        <div className="label">Hujjat:</div>
                        {result?.result_file ? (
                            <a
                                className="file-link"
                                href={result.result_file}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={displayNameFromUrl(result.result_file)}
                                title={displayNameFromUrl(result.result_file)}
                            >
                                {displayNameFromUrl(result.result_file)}
                            </a>
                        ) : (
                            <span className="file-none">Fayl biriktirilmagan</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompResultStatPage;
