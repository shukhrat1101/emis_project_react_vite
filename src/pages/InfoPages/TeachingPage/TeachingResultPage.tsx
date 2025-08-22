import React, {useEffect, useMemo, useState} from "react";
import {IoMdAddCircle} from "react-icons/io";
import {FaEdit} from "react-icons/fa";
import {FaTrashCan} from "react-icons/fa6";
import {useParams} from "react-router-dom";
import {toast} from "react-toastify";
import Loader from "../../../components/UI/Loader";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import TeachingResultModal, {
    TeachingResultInitial,
} from "../../../components/Modals/Teaching/TeachingResultModal";
import teachingResultService, {
    TeachingResult,
} from "../../../services/teachingResultService";
import "react-toastify/dist/ReactToastify.css";
import "./TeachingResultPage.scss";
import "../../../style/global.scss";

const TOAST = {
    LOAD_ERR: "tresult-load-error",
    CREATE_OK: "tresult-create-ok",
    UPDATE_OK: "tresult-update-ok",
    DELETE_OK: "tresult-delete-ok",
    ACTION_ERR: "tresult-action-error",
};

const MAX_TITLE_CHARS = 60;
const truncate = (s: string, n = MAX_TITLE_CHARS) =>
    s && s.length > n ? s.slice(0, n) + "…" : s;

const TeachingResultPage: React.FC = () => {
    const {id} = useParams();
    const teachingId = id ? Number(id) : undefined;

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<TeachingResult | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const titleFull = result?.teaching_name || "";
    const titleShort = useMemo(() => truncate(titleFull), [titleFull]);

    const load = async () => {
        if (!teachingId) return;
        try {
            setLoading(true);
            const res = await teachingResultService.getOneByTeaching(teachingId);
            setResult(res);
        } catch {
            toast.error("Natijalarni yuklashda xatolik!", {toastId: TOAST.LOAD_ERR});
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [teachingId]);

    const openCreate = () => setIsModalOpen(true);
    const openEdit = () => setIsModalOpen(true);

    const handleSubmit = async (fd: FormData) => {
        if (!teachingId) return;
        try {
            if (result?.id) {
                await teachingResultService.update(result.id, fd);
                toast.success("Ma'lumot yangilandi!", {toastId: TOAST.UPDATE_OK});
            } else {
                await teachingResultService.createIfAbsent(teachingId, {
                    overall_score: fd.get("overall_score") as File | null,
                    summary: (fd.get("summary") as string) ?? "",
                    suggestions: (fd.get("suggestions") as string) ?? "",
                });
                toast.success("Ma'lumot saqlandi!", {toastId: TOAST.CREATE_OK});
            }
            await load();
        } catch (e: any) {
            const exists = e?.code === "ALREADY_EXISTS";
            toast.error(
                exists ? "Bu o‘quv uchun natija allaqachon mavjud." : "Saqlashda xatolik yuz berdi!",
                {toastId: TOAST.ACTION_ERR}
            );
        } finally {
            setIsModalOpen(false);
        }
    };

    const handleDelete = async () => {
        if (!result?.id) return;
        try {
            await teachingResultService.delete(result.id);
            toast.success("Ma'lumot o‘chirildi!", {toastId: TOAST.DELETE_OK});
            setResult(null);
        } catch {
            toast.error("O‘chirishda xatolik yuz berdi!", {toastId: TOAST.ACTION_ERR});
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    const initialData: TeachingResultInitial | undefined = result
        ? {
            id: result.id,
            overall_score: result.overall_score || undefined,
            summary: result.summary,
            suggestions: result.suggestions,
        }
        : undefined;

    return (
        <div className="teaching-result-page">
            <div className="header">
                <h2 className="title" title={titleFull ? `Mavzu: ${titleFull}` : undefined}>
                    {titleFull ? titleShort : ""}
                </h2>
            </div>

            {loading ? (
                <Loader/>
            ) : (
                <>
                    {!result ? (
                        <div className="empty-state">
                            <button className="add-big" onClick={openCreate}>
                                <IoMdAddCircle/> Natijalarni qo‘shish
                            </button>
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
                                        download={
                                            teachingResultService.getSuggestedDownloadName(
                                                result.overall_score
                                            )
                                        }
                                        title={
                                            teachingResultService.getScoreFilename(result.overall_score)
                                        }
                                    >
                                        {teachingResultService.getScoreDisplay(result.overall_score)}
                                    </a>
                                ) : (
                                    <span className="file-none">Fayl biriktirilmagan</span>
                                )}
                            </div>

                            <div className="actions-bottom">
                                <button className="btn edit" onClick={openEdit}>
                                    <FaEdit/> Tahrirlash
                                </button>
                                <button
                                    className="btn delete"
                                    onClick={() => setIsDeleteModalOpen(true)}
                                >
                                    <FaTrashCan/> O‘chirish
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            <TeachingResultModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={initialData}
                teachingId={teachingId}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                text="Natijani o‘chirmoqchimisiz?"
                onCancel={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
            />
        </div>
    );
};

export default TeachingResultPage;
