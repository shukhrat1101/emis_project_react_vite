import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { IoArrowBackOutline } from "react-icons/io5";

import Loader from "../../../components/UI/Loader";
import courceSertifikatService, { Certificate } from "../../../services/courceSertifikatService";
import axiosInstance from "../../../services/axiosInstance";

import "../../InfoPages/CoursePage/CourceSertifikatPage.scss";
import "../../../style/global.scss";

const TOAST = {
    LOAD_ERR: "certstat-load-error",
};

const CourceEnrolSertif: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { state } = useLocation();
    const servicemanName: string | undefined = (state as any)?.servicemanName;

    const enrollmentId = id ? Number(id) : undefined;

    const [loading, setLoading] = useState(false);
    const [item, setItem] = useState<Certificate | null>(null);
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
            toast.error("Sertifikatni yuklashda xatolik!", { toastId: TOAST.LOAD_ERR });
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
                const { data } = await axiosInstance.get(url, { responseType: "blob" });
                const blob = new Blob([data], { type: "application/pdf" });
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

    const isPdfLink = !!item?.sertification_url?.toLowerCase().endsWith(".pdf");

    return (
        <div className="course-cert-page">
            {!loading && item ? (
                <div className="header">
                    <h2 className="title">{title}</h2>
                </div>
            ) : null}

            {loading ? (
                <Loader />
            ) : !item ? (
                <div className="empty-state" style={{ minHeight: "24vh", display: "grid", placeItems: "center" }}>
                    <div className="empty-text">Sertifikat mavjud emas !</div>
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
                                title="Sertifikat PDF"
                                className="pdf-frame"
                            />
                        </div>
                    )}

                    {isPdfLink && !pdfSrc && (
                        <div className="viewer">
                            <div className="pdf-fallback">PDF’ni ko‘rsatib bo‘lmadi. Yuqoridagi havola orqali yuklab oling.</div>
                        </div>
                    )}

                    <div className="actions-bottom">
                        <button className="btn back" onClick={() => navigate(-1)}>
                            <IoArrowBackOutline /> Orqaga
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourceEnrolSertif;
