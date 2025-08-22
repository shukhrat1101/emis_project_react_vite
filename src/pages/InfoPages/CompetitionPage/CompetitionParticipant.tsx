import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { IoMdAddCircle } from "react-icons/io";
import { FaTrashCan } from "react-icons/fa6";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Loader from "../../../components/UI/Loader";
import Pagination from "../../../components/UI/Pagination";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import ParticipantModal from "../../../components/Modals/Competition/ParticipantModal";

import participantService, { FlatParticipant } from "../../../services/participantService";

import "./CompetitionParticipant.scss";
import "../../../style/global.scss";

const TOAST = {
  LOAD_ERR: "participant-load-error",
  DELETE_OK: "participant-delete-ok",
  ACTION_ERR: "participant-action-error",
};

const CompetitionParticipant: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [competitionTitle, setCompetitionTitle] = useState<string>(""); // <- NEW

  const [all, setAll] = useState<FlatParticipant[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);

  const total = all.length;

  const items = useMemo(() => {
    const start = (page - 1) * pageSize;
    return all.slice(start, start + pageSize);
  }, [all, page, pageSize]);

  const fetchParticipants = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await participantService.listByCompetition(id, { page: 1, page_size: 10 });

      // Set title from API (e.g., "gsgdgds")
      const firstBlock = res?.results?.[0];
      setCompetitionTitle(firstBlock?.competition || `#${id}`);

      // Flatten -> jadvalga qulay ko‘rinish
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
    } catch (e) {
      console.error("Qatnashuvchilarni yuklashda xatolik:", e);
      toast.error("Qatnashuvchilarni yuklashda xatolik!", { toastId: TOAST.LOAD_ERR });
      setAll([]);
      setCompetitionTitle(`№ ${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    try {
      await participantService.delete(deleteId);
      toast.success("Ma`lumot o‘chirildi!", { toastId: TOAST.DELETE_OK });
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      setAll((prev) => prev.filter((x) => x.participant_id !== deleteId));
      const newTotal = total - 1;
      const maxPage = Math.max(1, Math.ceil(newTotal / pageSize));
      if (page > maxPage) setPage(maxPage);
    } catch (e) {
      console.error("O‘chirishda xatolik:", e);
      toast.error("O‘chirishda xatolik yuz berdi!", { toastId: TOAST.ACTION_ERR });
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [id]);

  return (
    <div className="compet-part-page">
      <div className="header">
        <h2 className="title">
          “{competitionTitle || `#${id}`}” ishtirokchilari
        </h2>
        <button className="add-btn" onClick={() => setIsAddOpen(true)}>
          <IoMdAddCircle /> Qo‘shish
        </button>
      </div>

      {loading ? (
        <Loader />
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
                <th className="amal">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((row, idx) => (
                  <tr key={row.participant_id}>
                    <td>{(page - 1) * pageSize + idx + 1}</td>
                    <td>{row.serviceman.full_name}</td>
                    <td>{row.serviceman.rank}</td>
                    <td>{row.serviceman.position}</td>
                    <td>{row.serviceman.military_unit}</td>
                    <td>{row.serviceman.pinfl}</td>
                    <td className="actions">
                      <div className="actions-inner">
                        <button
                          className="btn delete"
                          title="O‘chirish"
                          onClick={() => {
                            setDeleteId(row.participant_id);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <FaTrashCan />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center" }}>
                    Qatnashuvchilar topilmadi
                  </td>
                </tr>
              )}
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

      <ParticipantModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        competitionId={Number(id)}
        onSaved={fetchParticipants}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        text="Ushbu ishtirokchini o‘chirmoqchimisiz?"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default CompetitionParticipant;
