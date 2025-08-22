import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import Pagination from "../../../components/UI/Pagination";
import Loader from "../../../components/UI/Loader";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import PartDetailModal from "../../../components/Modals/Unit/PartDetailModal";
import PartModal from "../../../components/Modals/Unit/PartModal";

import partOfUnitService, {
    PartUnitCreateUpdate,
    PartUnitIn,
    PartUnitsResponse, ShtatDetail, UnitItem,
} from "../../../services/partofunitService";

import { toast } from "react-toastify";
import { FaEdit } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";
import { IoMdAddCircle } from "react-icons/io";

import "./UnitPage.scss";
import "../../../style/global.scss";

const UnitDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // departmentId

  const [units, setUnits] = useState<PartUnitIn[]>([]);
  const [departmentTitle, setDepartmentTitle] = useState<string>("");

  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [modalUnit, setModalUnit] = useState<PartUnitIn | null>(null); // for “Batafsil”
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);       // Add/Edit form
  const [editData, setEditData] = useState<
    { id?: number; name: string; type: string | number; shtat: string | number } | undefined
  >(undefined);
  const [deleteId, setDeleteId] = useState<number | null>(null);

    const isShtatDetail = (val: unknown): val is ShtatDetail => {
        return !!val && typeof val === "object" && Array.isArray((val as any).contingent_tables);
    };
    const toUnitItem = (u: PartUnitIn | null): UnitItem | null => {
        if (!u) return null;
        if (!isShtatDetail(u.shtat)) return null;
        const { shtat, ...rest } = u as any;
        return { ...rest, shtat } as UnitItem;
    };

  const fetchUnits = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data: PartUnitsResponse = await partOfUnitService.getUnitsByDepartmentId(id, {
        page,
        page_size: pageSize,
      });
      const list = Array.isArray(data?.results) ? data.results : [];
      setUnits(list);
      setTotal(data?.total ?? 0);
      setDepartmentTitle(list?.[0]?.department ?? "Bo‘lim");
    } catch (e: any) {
      setError(e?.message ?? "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [id, page, pageSize]);

  const title = useMemo(() => {
    if (loading) return "Yuklanmoqda...";
    if (error) return "Xatolik";
    return departmentTitle || "Bo‘lim";
  }, [loading, error, departmentTitle]);

  const getShtatId = (val: unknown): number | null => {
    if (typeof val === "number") return Number.isFinite(val) ? val : null;
    if (typeof val === "string") {
      const n = Number(val);
      return Number.isFinite(n) ? n : null;
    }
    if (val && typeof val === "object" && "id" in (val as any)) {
      const n = Number((val as any).id);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const handleAdd = () => {
    setEditData(undefined);
    setIsPartModalOpen(true);
  };

  const handleEdit = (u: PartUnitIn) => {
    setEditData({
      id: u.id,
      name: u.name,
      type: u.type,
      shtat: (getShtatId(u.shtat) ?? "") as any,
    });
    setIsPartModalOpen(true);
  };

  const handleSave = async (payload: { name: string; type: string | number; shtat: string | number }) => {
    if (!id) return;
    const dto: PartUnitCreateUpdate = {
      name: payload.name,
      type: String(payload.type),
      shtat: Number(payload.shtat),
    };

    try {
      if (editData?.id) {
        await partOfUnitService.update(id, editData.id, dto);
        toast.success("Ma`lumot yangilandi!");
      } else {
        await partOfUnitService.create(id, dto);
        toast.success("Ma`lumot qo`shildi!");
      }
      setIsPartModalOpen(false);
      await fetchUnits();
    } catch (e: any) {
      toast.error(e?.message ?? "Saqlashda xatolik");
    }
  };

  const handleDelete = (unitId: number) => setDeleteId(unitId);

  const handleConfirmDelete = async () => {
    if (!id || !deleteId) return;
    try {
      await partOfUnitService.delete(id, deleteId);
      toast.success("Ma`lumot o`chirildi!");
      setDeleteId(null);
      await fetchUnits();
    } catch (e: any) {
      toast.error(e?.message ?? "O‘chirishda xatolik");
      setDeleteId(null);
    }
  };

  return (
    <div className="department-table-page">
      <div className="header">
        <h2 className="title">{title}</h2>
        <button className="add-btn" onClick={handleAdd}>
          <IoMdAddCircle /> Qo‘shish
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <div className="table-wrapper">
          <div className="error-box">{error}</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Bo‘linma nomi</th>
                <th>Darajasi</th>
                <th>Shtati</th>
                <th className="amal">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {units.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center" }}>
                    Bo‘linmalar topilmadi
                  </td>
                </tr>
              )}

              {units.map((u) => {
                const degree = u?.shtat && (u as any).shtat?.degree ? (u as any).shtat.degree : u?.type ?? "-";
                const hasShtat = !!(u as any)?.shtat?.contingent_tables?.length;

                return (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{degree}</td>
                    <td>
                      {hasShtat ? (
                        <button className="btn detail" onClick={() => setModalUnit(u)}>
                          Batafsil
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="actions">
                      <div className="actions-inner">
                        <button className="btn edit" onClick={() => handleEdit(u)}>
                          <FaEdit />
                        </button>
                        <button className="btn delete" onClick={() => handleDelete(u.id)}>
                          <FaTrashCan />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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

        <PartDetailModal
            open={!!modalUnit}
            onClose={() => setModalUnit(null)}
            unit={toUnitItem(modalUnit)}
        />

      <PartModal
        isOpen={isPartModalOpen}
        onClose={() => setIsPartModalOpen(false)}
        onSubmit={handleSave}
        initialData={editData}
      />

      <ConfirmModal
        isOpen={!!deleteId}
        text="Haqiqatan ham o‘chirmoqchimisiz?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default UnitDetail;
