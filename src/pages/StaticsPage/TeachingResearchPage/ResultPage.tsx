import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Loader from "../../../components/UI/Loader";
import teachingResultService, {
    TeachingResult,
} from "../../../services/teachingResultService";
import "react-toastify/dist/ReactToastify.css";
import "../../InfoPages/TeachingPage/TeachingPage.scss";
import "../../../style/global.scss";

const TOAST = {
    LOAD_ERR: "result-load-error",
};

const MAX_TITLE_CHARS = 60;
const truncate = (s: string, n = MAX_TITLE_CHARS) =>
    s && s.length > n ? s.slice(0, n) + "…" : s;

const ResultPage: React.FC = () => {
    const { id } = useParams();
    const teachingId = id ? Number(id) : undefined;

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<TeachingResult | null>(null);

    const titleFull = result?.teaching_name || "";
    const titleShort = useMemo(() => truncate(titleFull), [titleFull]);

    const load = async () => {
        if (!teachingId) return;
        try {
            setLoading(true);
            const res = await teachingResultService.getOneByTeaching(teachingId);
            setResult(res);
        } catch {
            toast.error("Natijalarni yuklashda xatolik!", { toastId: TOAST.LOAD_ERR });
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [teachingId]);

    return (
        <div className="teaching-result-page">
            <div className="header">
                <h2
                    className="title"
                    title={titleFull ? `Mavzu: ${titleFull}` : undefined}
                >
                    {titleFull ? titleShort : ""}
                </h2>
            </div>

            {loading ? (
                <Loader />
            ) : !result ? (
                <div className="empty-state" style={{ textAlign: "center" }}>
                    <div className="empty-text">Natijalar mavjud emas !</div>
                </div>
            ) : (
                <div className="content">
                    <div className="cards">
                        <div className="card">
                            <div className="card-title">Xulosa:</div>
                            <div className="card-body">{result.summary || "—"}</div>
                        </div>
                        <div className="card">
                            <div className="card-title">Taklif:</div>
                            <div className="card-body">{result.suggestions || "—"}</div>
                        </div>
                    </div>

                    <div className="file-tile">
                        <div className="label">Hujjat:</div>
                        {result.overall_score ? (
                            <a
                                className="file-link"
                                href={result.overall_score}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={teachingResultService.getSuggestedDownloadName(
                                    result.overall_score
                                )}
                                title={teachingResultService.getScoreFilename(
                                    result.overall_score
                                )}
                            >
                                {teachingResultService.getScoreDisplay(result.overall_score)}
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

export default ResultPage;
