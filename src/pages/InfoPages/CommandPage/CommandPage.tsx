import React, { useEffect, useState } from "react";
import { IoMdAddCircle } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import commandService, {
  CommandDoc,
} from "../../../services/commandService";
import CommandModal from "../../../components/Modals/Command/CommandModal";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import Pagination from "../../../components/UI/Pagination";
import Loader from "../../../components/UI/Loader";

import "./CommandPage.scss";
import "../../../style/global.scss";

const TOAST = {
  LOAD_ERR: "command-load-error",
  CREATE_OK: "command-create-ok",
  UPDATE_OK: "command-update-ok",
  DELETE_OK: "command-delete-ok",
  ACTION_ERR: "command-action-error",
};

const CommandPage: React.FC = () => {
  const [items, setItems] = useState<CommandDoc[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<CommandDoc | undefined>(undefined);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await commandService.list(page, pageSize);
      setItems(res?.results || []);
      setTotal(res?.total || 0);
    } catch (e) {
      console.error("Buyruqlarni yuklashda xatolik:", e);
      toast.error("Buyruqlarni yuklashda xatolik!", { toastId: TOAST.LOAD_ERR });
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

  const handleEdit = (row: CommandDoc) => {
    setEditData(row);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await commandService.delete(deleteId);
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

  const handleFormSubmit = async (fd: FormData) => {
    try {
      if (editData?.id) {
        await commandService.update(editData.id, fd);
        toast.success("Ma'lumot yangilandi!", { toastId: TOAST.UPDATE_OK });
      } else {
        await commandService.create(fd);
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

  return (
    <div className="command-page">
      <div className="header">
        <h2 className="title">Buyruqlar ro‘yxati</h2>
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
                <th>Raqami</th>
                <th>Sana</th>
                <th>Muallif</th>
                <th>Fayl</th>
                <th className="amal">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(items) && items.length > 0 ? (
                items.map((row, index) => (
                  <tr key={row.id}>
                    <td>{(page - 1) * pageSize + index + 1}</td>
                    <td>{row.name}</td>
                    <td>{row.number}</td>
                    <td>{row.created_at}</td>
                    <td>{row.author}</td>
                    <td>
                      {row.command_url ? (
                        <a
                          href={row.command_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={commandService.getFileFilename(row.command_url)}
                          download={commandService.getSuggestedDownloadName(row.command_url)}
                          className="file-link"
                        >
                          {commandService.getFileDisplay(row.command_url)}
                        </a>
                      ) : (
                        "—"
                      )}
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

      <CommandModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editData}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        text="Ushbu buyruqni o‘chirmoqchimisiz?"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default CommandPage;
