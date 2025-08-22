import React, { useEffect, useState } from "react";
import { IoMdAddCircle } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Pagination from "../../../components/UI/Pagination";
import Loader from "../../../components/UI/Loader";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import TeachingBranchModal from "../../../components/Modals/Teaching/TeachingBranchModal";
import teachingBranchService, {
  TeachingBranch as Branch,
  TeachingBranchPayload,
} from "../../../services/teachingBranchService";
import "react-toastify/dist/ReactToastify.css";
import "./TeachingPage.scss";
import "../../../style/global.scss";

const TOAST = {
  LOAD_ERR: "tbranch-load-error",
  CREATE_OK: "tbranch-create-ok",
  UPDATE_OK: "tbranch-update-ok",
  DELETE_OK: "tbranch-delete-ok",
  ACTION_ERR: "tbranch-action-error",
};

const MAX_TITLE_CHARS = 100;
const truncate = (s: string, n = MAX_TITLE_CHARS) =>
  s.length > n ? s.slice(0, n) + "…" : s;

const TeachingBranchPage: React.FC = () => {
  const { id } = useParams();
  const teachingId = id ? Number(id) : undefined;

  const [items, setItems] = useState<Branch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<
    | {
        id?: number;
        name?: string;
        branch_type?: string;
        military_count?: number;
        teaching?: number | string;
      }
    | undefined
  >(undefined);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

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
    } catch (e) {
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

  const handleAdd = () => {
    setEditData(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (row: Branch) => {
    setEditData({
      id: row.id,
      name: row.name,
      branch_type: row.branch_type,
      military_count: row.military_count,
      teaching: teachingId,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await teachingBranchService.delete(deleteId);
      toast.success("Ma'lumot o‘chirildi!", { toastId: TOAST.DELETE_OK });
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      const newTotal = Math.max(0, total - 1);
      const maxPage = Math.max(1, Math.ceil(newTotal / pageSize));
      if (page > maxPage) setPage(maxPage);
      else fetchList();
    } catch (e) {
      toast.error("O‘chirishda xatolik yuz berdi!", {
        toastId: TOAST.ACTION_ERR,
      });
    }
  };

  const handleFormSubmit = async (payload: TeachingBranchPayload) => {
    try {
      const finalPayload: TeachingBranchPayload = {
        ...payload,
        teaching: teachingId ?? payload.teaching,
      };
      if (editData?.id) {
        await teachingBranchService.update(editData.id, finalPayload);
        toast.success("Ma'lumot yangilandi!", { toastId: TOAST.UPDATE_OK });
      } else {
        await teachingBranchService.create(finalPayload);
        toast.success("Ma'lumot saqlandi!", { toastId: TOAST.CREATE_OK });
      }
      fetchList();
    } catch (e) {
      toast.error("Saqlashda xatolik yuz berdi!", {
        toastId: TOAST.ACTION_ERR,
      });
    } finally {
      setIsModalOpen(false);
    }
  };

  const teachingName = items[0]?.teaching_name || "";

  return (
    <div className="teach-year-page">
      <div className="header">
        <h2
          className="title"
          title={teachingName ? `Mavzu: ${teachingName}` : undefined}
        >
          Mavzu: {teachingName ? truncate(teachingName) : "—"}
        </h2>
        <button className="add-btn" onClick={handleAdd} disabled={!teachingId}>
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
                <th>Jamoa nomi</th>
                <th>Bo‘linma turi</th>
                <th>Harbiylar soni</th>
                <th className="amal">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(items) && items.length > 0 ? (
                items.map((row, index) => (
                  <tr key={row.id}>
                    <td>{(page - 1) * pageSize + index + 1}</td>
                    <td>{row.name}</td>
                    <td>{row.branch_type}</td>
                    <td>{row.military_count}</td>
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
                  <td colSpan={7} style={{ textAlign: "center" }}>
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

      <TeachingBranchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editData}
        teachingId={teachingId}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        text="Ushbu bo‘linmani o‘chirmoqchimisiz?"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default TeachingBranchPage;
