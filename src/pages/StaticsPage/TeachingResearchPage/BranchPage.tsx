import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Pagination from "../../../components/UI/Pagination";
import Loader from "../../../components/UI/Loader";
import teachingBranchService, {
    TeachingBranch as Branch,
} from "../../../services/teachingBranchService";
import "react-toastify/dist/ReactToastify.css";
import "../../InfoPages/TeachingPage/TeachingPage.scss";
import "../../../style/global.scss";

const TOAST = {
    LOAD_ERR: "branch-load-error",
};

const MAX_TITLE_CHARS = 100;
const truncate = (s: string, n = MAX_TITLE_CHARS) =>
    s.length > n ? s.slice(0, n) + "…" : s;

const BranchPage: React.FC = () => {
    const { id } = useParams();
    const teachingId = id ? Number(id) : undefined;

    const [items, setItems] = useState<Branch[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(false);

    const fetchList = async () => {
        if (!teachingId) return;
        try {
            setLoading(true);
            const res = await teachingBranchService.listByTeaching(
                teachingId,
                page,
                pageSize
            );
            setItems(res.results || []);
            setTotal(res.total || 0);
        } catch {
            toast.error("Bo‘linmalarni yuklashda xatolik!", {
                toastId: TOAST.LOAD_ERR,
            });
            setItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, [teachingId, page, pageSize]);

    const teachingName = items[0]?.teaching_name || "";
    const hasData = items.length > 0;

    return (
        <div className="teach-year-page">
            {hasData && teachingName && (
                <div className="header">
                    <h2
                        className="title"
                        title={`Mavzu: ${teachingName}`}
                    >
                        Mavzu: {truncate(teachingName)}
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
                    <div className="empty-text">
                        Bo‘linmalar mavjud emas !
                    </div>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                        <tr>
                            <th>T/R</th>
                            <th>Jamoa nomi</th>
                            <th>Bo‘linma turi</th>
                            <th>Harbiylar soni</th>
                        </tr>
                        </thead>
                        <tbody>
                        {items.map((row, index) => (
                            <tr key={row.id}>
                                <td>{(page - 1) * pageSize + index + 1}</td>
                                <td>{row.name}</td>
                                <td>{row.branch_type}</td>
                                <td>{row.military_count}</td>
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

export default BranchPage;
