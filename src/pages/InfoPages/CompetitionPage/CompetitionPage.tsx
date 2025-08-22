import React, { useEffect, useState } from "react";
import { IoMdAddCircle } from "react-icons/io";
import { FaEdit, FaEye } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import competitionService, {
  Competition,
  CompetitionPayload,
} from "../../../services/competitionService";
import CompetitionModal from "../../../components/Modals/Competition/CompetitionModal";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import Pagination from "../../../components/UI/Pagination";
import Loader from "../../../components/UI/Loader";

import "./CompetitionPage.scss";
import "../../../style/global.scss";

const TOAST = {
  LOAD_ERR: "competition-load-error",
  CREATE_OK: "competition-create-ok",
  UPDATE_OK: "competition-update-ok",
  DELETE_OK: "competition-delete-ok",
  ACTION_ERR: "competition-action-error",
};

const CompetitionPage: React.FC = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState<Competition[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<Competition | undefined>(undefined);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await competitionService.list(page, pageSize);
      setItems(res?.results || []);
      setTotal(res?.total || 0);
    } catch (e) {
      console.error("Musobaqalarni yuklashda xatolik:", e);
      toast.error("Musobaqalarni yuklashda xatolik!", { toastId: TOAST.LOAD_ERR });
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [page, pageSize]);

  const handleAdd = () => {
    setEditData(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (row: Competition) => {
    setEditData(row);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await competitionService.delete(deleteId);
      toast.success("Ma'lumot o‘chirildi!", { toastId: TOAST.DELETE_OK });
      setIsDeleteModalOpen(false);
      setDeleteId(null);

      const newTotal = Math.max(0, total - 1);
      const maxPage = Math.max(1, Math.ceil(newTotal / pageSize));
      if (page > maxPage) setPage(maxPage);
      else fetchList();
    } catch (e) {
      console.error("O‘chirishda xatolik:", e);
      toast.error("O‘chirishda xatolik yuz berdi!", { toastId: TOAST.ACTION_ERR });
    }
  };

  const handleFormSubmit = async (payload: CompetitionPayload) => {
    try {
      if (editData?.id) {
        await competitionService.update(editData.id, payload);
        toast.success("Ma'lumot yangilandi!", { toastId: TOAST.UPDATE_OK });
      } else {
        await competitionService.create(payload);
        toast.success("Ma'lumot saqlandi!", { toastId: TOAST.CREATE_OK });
      }
      fetchList();
    } catch (e) {
      console.error("Saqlashda xatolik:", e);
      toast.error("Saqlashda xatolik yuz berdi!", { toastId: TOAST.ACTION_ERR });
    } finally {
      setIsModalOpen(false);
    }
  };

  const goParticipants = (id: number) => {
    navigate(`/malumotnoma/konkurs/competitions/${id}/participants`);
  };

  const goResult = (id: number) => {
    navigate(`/malumotnoma/konkurs/competitions/${id}/result`);
  };

  return (
    <div className="compet-page">
      <div className="header">
        <h2 className="title">Musobaqalar ro‘yxati</h2>
        <button className="add-btn" onClick={handleAdd}>
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
                <th>Daraja turi</th>
                <th>Mavzu</th>
                <th>O‘tkazish joyi</th>
                <th>Sana</th>
                <th>O‘quv yili</th>
                <th>Ishtirokchilar</th>
                <th>Natija</th>
                <th className="amal">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(items) && items.length > 0 ? (
                items.map((row, index) => (
                  <tr key={row.id}>
                    <td>{(page - 1) * pageSize + index + 1}</td>
                    <td>{row.type}</td>
                    <td>{row.lesson}</td>
                    <td>{row.competition_place}</td>
                    <td>
                      {row.start_date} / {row.end_date}
                    </td>
                    <td>{row.teaching_year ?? "—"}</td>

                    <td className="participants-cell">
                      <button
                        className="btn detail"
                        onClick={() => goParticipants(row.id)}
                        title="Qatnashuvchilarni ko‘rish"
                      >
                        <FaEye /> Ishtirokchilar
                      </button>
                    </td>

                    <td className="result-cell">
                      <button
                        className="btn detail"
                        onClick={() => goResult(row.id)}
                        title="Natijani ko‘rish"
                      >
                        <FaEye />
                      </button>
                    </td>

                    <td className="actions">
                      <div className="actions-inner">
                        <button
                          className="btn edit"
                          onClick={() => handleEdit(row)}
                          title="Tahrirlash"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn delete"
                          onClick={() => {
                            setDeleteId(row.id);
                            setIsDeleteModalOpen(true);
                          }}
                          title="O‘chirish"
                        >
                          <FaTrashCan />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center" }}>
                    Maʼlumot topilmadi
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

      <CompetitionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editData}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        text="Ushbu musobaqani o‘chirmoqchimisiz?"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default CompetitionPage;
