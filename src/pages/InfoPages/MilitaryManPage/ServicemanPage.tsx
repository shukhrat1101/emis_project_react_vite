import React, { useEffect, useMemo, useState } from "react";
import { IoMdAddCircle } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";
import { toast } from "react-toastify";

import servicemanService, {
  ServicemanListItem,
  ServicemanPayload,
} from "../../../services/servicemanService";

import ConfirmModal from "../../../components/Modals/ConfirmModal";
import Pagination from "../../../components/UI/Pagination";
import Loader from "../../../components/UI/Loader";


import "react-toastify/dist/ReactToastify.css";
import "./ServicemanPage.scss";
import "../../../style/global.scss";
import ServicemanModal from "../../../components/Modals/MilitaryMen/ServicemanModal";
import SearchBar from "../../../components/UI/Search";

const TOAST = {
  LOAD_ERR: "serviceman-load-error",
  CREATE_OK: "serviceman-create-ok",
  UPDATE_OK: "serviceman-update-ok",
  DELETE_OK: "serviceman-delete-ok",
  ACTION_ERR: "serviceman-action-error",
};

const ServicemanPage: React.FC = () => {
  const [items, setItems] = useState<ServicemanListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<ServicemanListItem | undefined>(undefined);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [query, setQuery] = useState("");

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await servicemanService.list({
        page,
        page_size: pageSize,
        search: query || undefined,
      });
      setItems(res?.results ?? []);
      setTotal(res?.total ?? 0);
    } catch (e) {
      console.error("Serviceman list load error:", e);
      toast.error("Ro‘yxatni yuklashda xatolik!", { toastId: TOAST.LOAD_ERR });
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [page, pageSize, query]);

  const handleAdd = () => {
    setEditRow(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (row: ServicemanListItem) => {
    setEditRow(row);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    try {
      await servicemanService.remove(deleteId);
      toast.success("Ma'lumot o‘chirildi!", { toastId: TOAST.DELETE_OK });
      setIsDeleteModalOpen(false);
      setDeleteId(null);

      const lastItemOnPage = items.length === 1 && page > 1;
      if (lastItemOnPage) setPage((p) => p - 1);
      else fetchList();
    } catch (e) {
      console.error("Delete error:", e);
      toast.error("O‘chirishda xatolik yuz berdi!", { toastId: TOAST.ACTION_ERR });
    }
  };

  const handleFormSubmit = async (payload: ServicemanPayload) => {
    try {
      if (editRow?.id) {
        await servicemanService.update(editRow.id, payload);
        toast.success("Ma'lumot yangilandi!", { toastId: TOAST.UPDATE_OK });
      } else {
        await servicemanService.create(payload);
        toast.success("Ma'lumot saqlandi!", { toastId: TOAST.CREATE_OK });
      }
      fetchList();
    } catch (e) {
      console.error("Save error:", e);
      toast.error("Saqlashda xatolik yuz berdi!", { toastId: TOAST.ACTION_ERR });
    } finally {
      setIsModalOpen(false);
    }
  };

  const initialDataForModal = useMemo(() => {
    if (!editRow) return undefined;
    return {
      id: editRow.id,
      full_name: editRow.full_name,
      position: editRow.position,
      pinfl: editRow.pinfl,
      rankName: editRow.rank,
      unitName: editRow.military_unit,
    };
  }, [editRow]);

  const handleSearch = (q: string) => {
    setPage(1);
    setQuery(q);
  };

  return (
    <div className="men-page">
      <div className="header">
        <div className="header-top">
          <h2 className="title">Harbiy xizmatchilar ro‘yxati</h2>
          <button className="add-btn" onClick={handleAdd}>
            <IoMdAddCircle /> Qo‘shish
          </button>
        </div>

        <div className="header-bottom">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Qidirish..."
            initialValue={query}
            className="search-full"
          />
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>T/R</th>
                <th>Unvon</th>
                <th>F.I.Sh</th>
                <th>Lavozim</th>
                <th>Harbiy qism</th>
                <th>PINFL</th>
                <th className="amal">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(items) && items.length > 0 ? (
                items.map((row, idx) => (
                  <tr key={row.id}>
                    <td>{(page - 1) * pageSize + idx + 1}</td>
                    <td>{row.rank}</td>
                    <td>{row.full_name}</td>
                    <td>{row.position}</td>
                    <td>{row.military_unit}</td>
                    <td>{row.pinfl}</td>
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

      <ServicemanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={initialDataForModal}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        text="Harbiy xizmachini o‘chirmoqchimisiz?"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ServicemanPage;
