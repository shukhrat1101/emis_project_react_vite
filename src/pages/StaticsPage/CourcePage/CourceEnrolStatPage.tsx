import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PiCertificateFill } from "react-icons/pi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Loader from "../../../components/UI/Loader";
import Pagination from "../../../components/UI/Pagination";
import enrollmentService, { FlatEnrollment } from "../../../services/enrollmentService";

import "../../InfoPages/CompetitionPage/CompetitionParticipant.scss";
import "../../../style/global.scss";

const TOAST = {
    LOAD_ERR: "enrollstat-load-error",
};

const CourceEnrolStatPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [courseTitle, setCourseTitle] = useState<string>("");
    const [all, setAll] = useState<FlatEnrollment[]>([]);
    const [loading, setLoading] = useState(false);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const total = all.length;
    const hasData = total > 0;

    const items = useMemo(() => {
        const start = (page - 1) * pageSize;
        return all.slice(start, start + pageSize);
    }, [all, page, pageSize]);

    const fetchEnrollments = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await enrollmentService.listByCourse(Number(id), { page: 1, page_size: 50 });
            const first: any = res?.results?.[0];
            setCourseTitle(first?.course_name || "");
            const flat = enrollmentService.toFlat(res);
            setAll(flat);
        } catch (e) {
            toast.error("Tinglovchilarni yuklashda xatolik!", { toastId: TOAST.LOAD_ERR });
            setAll([]);
            setCourseTitle("");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEnrollments();
    }, [id]);

    const goCertificate = (enrollmentId: number, fullName: string) => {
        navigate(`/kurs/enrollment/${enrollmentId}/certificate`, {
            state: { servicemanName: fullName },
        });
    };

    return (
        <div className="compet-part-page">
            <div className="header">
                {hasData ? (
                    <h2 className="title">“{courseTitle || `#${id}`}” tinglovchilari</h2>
                ) : (
                    <div />
                )}
            </div>

            {loading ? (
                <Loader />
            ) : !hasData ? (
                <div
                    className="empty-state"
                    style={{ minHeight: "48vh", display: "grid", placeItems: "center" }}
                >
                    <div className="empty-text">Kursda o‘quvchilar mavjud emas!</div>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                        <tr>
                            <th>T/R</th>
                            <th>F.I.Sh</th>
                            <th>Unvon</th>
                            <th>Lavozim</th>
                            <th>Harbiy qism</th>
                            <th>JSHSHIR</th>
                            <th className="participants-cell">Sertifikat</th>
                        </tr>
                        </thead>
                        <tbody>
                        {items.map((row, idx) => (
                            <tr key={row.enrollment_id}>
                                <td>{(page - 1) * pageSize + idx + 1}</td>
                                <td>{row.serviceman.full_name}</td>
                                <td>{row.serviceman.rank}</td>
                                <td>{row.serviceman.position}</td>
                                <td>{row.serviceman.military_unit}</td>
                                <td>{row.serviceman.pinfl}</td>
                                <td className="participants-cell">
                                    <button
                                        className="btn detail"
                                        title="Sertifikatni ko‘rish"
                                        onClick={() => goCertificate(row.enrollment_id, row.serviceman.full_name)}
                                    >
                                        <PiCertificateFill size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
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

export default CourceEnrolStatPage;
