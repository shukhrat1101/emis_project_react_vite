import React, { useEffect, useState } from "react";
import { IoMdAddCircle } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";
import positionService from "../../../services/positionService";
import Pagination from "../../../components/UI/Pagination";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import PositionModal from "../../../components/Modals/Position/PositionModal";
import Loader from "../../../components/UI/Loader";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./PositionPage.scss";

interface Position {
  id: number;
  name: string;
  type: string;
  self_rank: string | number;
}

const TOAST = {
  LOAD_ERR: "position-load-error",
  CREATE_OK: "position-create-ok",
  UPDATE_OK: "position-update-ok",
  DELETE_OK: "position-delete-ok",
  ACTION_ERR: "position-action-error",
};

const PositionPage: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<Position | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchPositions();
  }, [page, pageSize]);

    const fetchPositions = async () => {
        setLoading(true);
        try {
            const res = await positionService.getAll(page, pageSize);

            const normalized: Position[] = (res.results ?? []).map((r: any) => ({
                id: Number(r.id),
                name: r.name ?? "",
                type: r.type ?? "",
                self_rank: r.self_rank ?? "-",
            }));

            setPositions(normalized);
            setTotal(Number(res.total ?? res.count ?? normalized.length));
        } catch (error) {
            console.error("Lavozimlarni olishda xatolik:", error);
            toast.error("Lavozimlarni yuklashda xatolik!", { toastId: TOAST.LOAD_ERR });
            setPositions([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };


    const handleAdd = () => {
    setEditData(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Position) => {
    setEditData(item);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await positionService.delete(deleteId);
      toast.success("Ma'lumot o‘chirildi!", { toastId: TOAST.DELETE_OK });
      fetchPositions();
    } catch (error) {
      console.error("O‘chirishda xatolik:", error);
      toast.error("O‘chirishda xatolik yuz berdi!", { toastId: TOAST.ACTION_ERR });
    } finally {
      setDeleteId(null);
      setIsDeleteModalOpen(false);
    }
  };

  const handleFormSubmit = async (formData: FormData) => {
    try {
      if (editData?.id) {
        await positionService.update(editData.id, formData);
        toast.success("Ma'lumot yangilandi!", { toastId: TOAST.UPDATE_OK });
      } else {
        await positionService.create(formData);
        toast.success("Ma'lumot saqlandi!", { toastId: TOAST.CREATE_OK });
      }
      fetchPositions();
    } catch (error) {
      console.error("Saqlashda xatolik:", error);
      toast.error("Saqlashda xatolik yuz berdi!", { toastId: TOAST.ACTION_ERR });
    } finally {
      setIsModalOpen(false);
    }
  };

  return (
    <div className="position-page">
      <div className="header">
        <h2 className="title">Lavozimlar ro‘yxati</h2>
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
                <th>Nomi</th>
                <th>Tur</th>
                <th>Unvon darajasi</th>
                <th className="amal">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((item, index) => (
                <tr key={item.id}>
                  <td>{(page - 1) * pageSize + index + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.type}</td>
                  <td>{item.self_rank}</td>
                  <td className="actions">
                    <div className="actions-inner">
                      <button className="btn edit" onClick={() => handleEdit(item)}>
                        <FaEdit />
                      </button>
                      <button
                        className="btn delete"
                        onClick={() => {
                          setDeleteId(item.id);
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        <FaTrashCan />
                      </button>
                    </div>
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
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      )}

      <PositionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editData}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        text="Lavozimni o‘chirmoqchimisiz?"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default PositionPage;
