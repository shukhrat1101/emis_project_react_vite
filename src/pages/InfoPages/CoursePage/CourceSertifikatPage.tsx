import React, {useEffect, useMemo, useState} from "react";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import {IoMdAddCircle} from "react-icons/io";
import {FaEdit} from "react-icons/fa";
import {FaTrashCan} from "react-icons/fa6";
import {toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Loader from "../../../components/UI/Loader";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import CourceSertifikatModal, {
    CourceSertifikatInitial,
} from "../../../components/Modals/Course/CourceSertifikatModal";
import courceSertifikatService, {
    Certificate,
} from "../../../services/courceSertifikatService";
import axiosInstance from "../../../services/axiosInstance";

import "./CourceSertifikatPage.scss";
import "../../../style/global.scss";
import {IoArrowBackOutline} from "react-icons/io5";

const TOAST = {
    LOAD_ERR: "cert-load-error",
    CREATE_OK: "cert-create-ok",
    UPDATE_OK: "cert-update-ok",
    DELETE_OK: "cert-delete-ok",
    ACTION_ERR: "cert-action-error",
};



const CourceSertifikatPage: React.FC = () => {
    const navigate = useNavigate();
    const {id} = useParams<{ id: string }>(); // enrollment id
    const {state} = useLocation();
    const servicemanName: string | undefined = (state as any)?.servicemanName;

    const enrollmentId = id ? Number(id) : undefined;

    const [loading, setLoading] = useState(false);
    const [item, setItem] = useState<Certificate | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // blob URL (PDF’ni iframe’da ko‘rsatish uchun)
    const [pdfSrc, setPdfSrc] = useState<string | null>(null);

    const title = useMemo(
        () => `${servicemanName ? `${servicemanName}ning ` : ""}sertifikati`,
        [servicemanName]
    );

    const load = async () => {
        if (!enrollmentId) return;
        try {
            setLoading(true);
            const one = await courceSertifikatService.getOneByEnrollment(enrollmentId);
            setItem(one);
        } catch {
            toast.error("Sertifikatni yuklashda xatolik!", {toastId: TOAST.LOAD_ERR});
            setItem(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [enrollmentId]);

    useEffect(() => {
        let revokeUrl: string | null = null;

        const makeBlob = async (url: string) => {
            try {
                const {data} = await axiosInstance.get(url, {responseType: "blob"});
                const blob = new Blob([data], {type: "application/pdf"});
                const blobUrl = URL.createObjectURL(blob);
                revokeUrl = blobUrl;
                setPdfSrc(blobUrl);
            } catch {
                setPdfSrc(null);
            }
        };

        const url = item?.sertification_url || "";
        const isPdf = url.toLowerCase().endsWith(".pdf");

        if (isPdf) {
            setPdfSrc(null);
            makeBlob(url);
        } else {
            setPdfSrc(null);
        }

        return () => {
            if (revokeUrl) URL.revokeObjectURL(revokeUrl);
        };
    }, [item?.sertification_url]);

    const handleSubmit = async (fd: FormData) => {
        if (!enrollmentId) return;
        try {
            if (item?.id) {
                await courceSertifikatService.update(item.id, fd);
                toast.success("Ma'lumot yangilandi!", {toastId: TOAST.UPDATE_OK});
            } else {
                await courceSertifikatService.create(fd);
                toast.success("Ma'lumot saqlandi!", {toastId: TOAST.CREATE_OK});
            }
            await load();
        } catch {
            toast.error("Saqlashda xatolik yuz berdi!", {toastId: TOAST.ACTION_ERR});
        } finally {
            setIsModalOpen(false);
        }
    };

    const handleDelete = async () => {
        if (!item?.id) return;
        try {
            await courceSertifikatService.remove(item.id);
            toast.success("Ma'lumot o‘chirildi!", {toastId: TOAST.DELETE_OK});
            setItem(null);
            setPdfSrc(null);
        } catch {
            toast.error("O‘chirishda xatolik yuz berdi!", {toastId: TOAST.ACTION_ERR});
        } finally {
            setIsDeleteOpen(false);
        }
    };

    const initialData: CourceSertifikatInitial | undefined = item
        ? {
            id: item.id,
            sertification_number: item.sertification_number ?? "",
            sertification_url: item.sertification_url ?? undefined,
            issued_at: item.issued_at ?? undefined,
        }
        : undefined;

    const isPdfLink = !!item?.sertification_url?.toLowerCase().endsWith(".pdf");



    return (
        <div className="course-cert-page">
            <div className="header">
                <h2 className="title">{title}</h2>
            </div>

            {loading ? (
                <Loader/>
            ) : !item ? (
                <div className="empty-state">
                    <button className="add-big" onClick={() => setIsModalOpen(true)}>
                        <IoMdAddCircle/> Sertifikat qo‘shish
                    </button>
                </div>
            ) : (
                <div className="content">
                    <div className="meta">
                        <div className="row">
                            <div className="label">Sertifikat raqami:</div>
                            <div className="value">{item.sertification_number || "—"}</div>
                        </div>

                        <div className="row">
                            <div className="label">Sertifikat (yuklab olish):</div>
                            {item.sertification_url ? (
                                <a
                                    className="file-link"
                                    href={item.sertification_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Faylni yuklab olish
                                </a>
                            ) : (
                                <div className="value">—</div>
                            )}
                        </div>
                    </div>

                    {isPdfLink && pdfSrc && (
                        <div className="viewer">
                            <iframe
                                src={`${pdfSrc}#toolbar=0&navpanes=0&scrollbar=1&zoom=page-width`}
                                // src={`${pdfSrc}#view=FitH&toolbar=0`}
                                title="Sertifikat PDF"
                                className="pdf-frame"
                            />
                        </div>
                    )}

                    {isPdfLink && !pdfSrc && (
                        <div className="viewer">
                            <div className="pdf-fallback">
                                PDF’ni ko‘rsatib bo‘lmadi. Yuqoridagi havola orqali yuklab oling.
                            </div>
                        </div>
                    )}

                    <div className="actions-bottom">
                        <button className="btn back" onClick={() => navigate(-1)}>
                            <IoArrowBackOutline/> Orqaga
                        </button>
                        <button className="btn edit" onClick={() => setIsModalOpen(true)}>
                            <FaEdit/> Tahrirlash
                        </button>
                        <button className="btn delete" onClick={() => setIsDeleteOpen(true)}>
                            <FaTrashCan/> O‘chirish
                        </button>
                    </div>
                </div>
            )}

            <CourceSertifikatModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                enrollmentId={enrollmentId!}
                initialData={initialData}
            />

            <ConfirmModal
                isOpen={isDeleteOpen}
                text="Sertifikatni o‘chirmoqchimisiz?"
                onCancel={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
            />
        </div>
    );
};

export default CourceSertifikatPage;
