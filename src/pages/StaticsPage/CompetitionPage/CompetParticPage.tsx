import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Loader from "../../../components/UI/Loader";
import Pagination from "../../../components/UI/Pagination";

import participantService, { FlatParticipant } from "../../../services/participantService";

import "../../InfoPages/CompetitionPage/CompetitionParticipant.scss";
import "../../../style/global.scss";

const TOAST = {
    LOAD_ERR: "participantstat-load-error",
};

const CompetParticPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const [competitionTitle, setCompetitionTitle] = useState<string>("");
    const [all, setAll] = useState<FlatParticipant[]>([]);
    const [loading, setLoading] = useState(false);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const total = all.length;
    const hasData = total > 0;

    const items = useMemo(() => {
        const start = (page - 1) * pageSize;
        return all.slice(start, start + pageSize);
    }, [all, page, pageSize]);

    const fetchParticipants = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await participantService.listByCompetition(id, { page: 1, page_size: 10 });
            const firstBlock = res?.results?.[0];
            setCompetitionTitle(firstBlock?.competition || "");
            const flat: FlatParticipant[] =
                (res.results || []).flatMap((block) =>
                    (block.participants || []).map((p) => ({
                        participant_id: p.id,
                        competition_id: Number(id),
                        competition: block.competition,
                        serviceman: p.military_serviceman,
                    }))
                );
            setAll(flat);
        } catch {
            toast.error("Qatnashuvchilarni yuklashda xatolik!", { toastId: TOAST.LOAD_ERR });
            setAll([]);
            setCompetitionTitle("");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParticipants();
    }, [id]);

    return (
        <div className="compet-part-page">
            {hasData && (
                <div className="header">
                    <h2 className="title">“{competitionTitle}” ishtirokchilari</h2>
                </div>
            )}

            {loading ? (
                <Loader />
            ) : !hasData ? (
                <div
                    className="empty-state"
                    style={{ minHeight: "48vh", display: "grid", placeItems: "center" }}
                >
                    <div className="empty-text">Ishtirokchilar mavjud emas!</div>
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
                        </tr>
                        </thead>
                        <tbody>
                        {items.map((row, idx) => (
                            <tr key={row.participant_id}>
                                <td>{(page - 1) * pageSize + idx + 1}</td>
                                <td>{row.serviceman.full_name}</td>
                                <td>{row.serviceman.rank}</td>
                                <td>{row.serviceman.position}</td>
                                <td>{row.serviceman.military_unit}</td>
                                <td>{row.serviceman.pinfl}</td>
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

export default CompetParticPage;
