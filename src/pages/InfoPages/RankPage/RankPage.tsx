import React, {useEffect, useState} from 'react';
import {IoMdAddCircle} from 'react-icons/io';
import {FaEdit} from 'react-icons/fa';
import {FaTrashCan} from 'react-icons/fa6';
import rankService from "../../../services/rankService";
import AddEditModal from "../../../components/Modals/Rank/RankModal";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import Pagination from "../../../components/UI/Pagination";
import Loader from "../../../components/UI/Loader";
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './RankPage.scss';
import "../../../style/global.scss";

interface Rank {
    id: number;
    name: string;
    rank_type: string;
}

const TOAST = {
    LOAD_ERR: "rank-load-error",
    CREATE_OK: "rank-create-ok",
    UPDATE_OK: "rank-update-ok",
    DELETE_OK: "rank-delete-ok",
    ACTION_ERR: "rank-action-error",
};

const RankPage: React.FC = () => {
    const [ranks, setRanks] = useState<Rank[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState<Rank | undefined>(undefined);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

// fetchRanks ichini shu tarzda yozing
    const fetchRanks = async () => {
        try {
            setLoading(true);
            const res = await rankService.getAll(page, pageSize);

            const rows: Rank[] = (res?.results ?? []).map(r => ({
                id: Number(r.id),
                name: r.name ?? "",
                rank_type: r.rank_type ?? "",
            }));

            setRanks(rows);
            setTotal(Number(res?.total ?? res?.count ?? rows.length));
        } catch (error) {
            console.error("Unvonlarni yuklashda xatolik:", error);
            toast.error("Unvonlarni yuklashda xatolik!", {toastId: TOAST.LOAD_ERR});
            setRanks([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchRanks();
    }, [page, pageSize]);

    const handleAdd = () => {
        setEditData(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (rank: Rank) => {
        setEditData(rank);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (deleteId !== null) {
            try {
                await rankService.delete(deleteId);
                toast.success("Ma'lumot o‘chirildi!", {toastId: TOAST.DELETE_OK});
                setDeleteId(null);
                setIsDeleteModalOpen(false);
                fetchRanks();
            } catch (error) {
                console.error('O‘chirishda xatolik:', error);
                toast.error("O‘chirishda xatolik yuz berdi!", {toastId: TOAST.ACTION_ERR});
            }
        }
    };

    const handleFormSubmit = async (formData: FormData) => {
        try {
            if (editData?.id) {
                await rankService.update(editData.id, formData);
                toast.success("Ma'lumot yangilandi!", {toastId: TOAST.UPDATE_OK});
            } else {
                await rankService.create(formData);
                toast.success("Ma'lumot saqlandi!", {toastId: TOAST.CREATE_OK});
            }
            fetchRanks();
        } catch (error) {
            console.error('Saqlashda xatolik:', error);
            toast.error("Saqlashda xatolik yuz berdi!", {toastId: TOAST.ACTION_ERR});
        } finally {
            setIsModalOpen(false);
        }
    };

    return (
        <div className="rank-page">
            <div className="header">
                <h2 className="title">Unvonlar ro‘yxati</h2>
                <button className="add-btn" onClick={handleAdd}>
                    <IoMdAddCircle/> Qo‘shish
                </button>
            </div>

            {loading ? (
                <Loader/>
            ) : (
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                        <tr>
                            <th>T/R</th>
                            <th>Unvon nomi</th>
                            <th>Unvon turi</th>
                            <th className="amal">Amallar</th>
                        </tr>
                        </thead>
                        <tbody>
                        {Array.isArray(ranks) && ranks.length > 0 ? (
                            ranks.map((rank, index) => (
                                <tr key={rank.id}>
                                    <td>{(page - 1) * pageSize + index + 1}</td>
                                    <td>{rank.name}</td>
                                    <td>{rank.rank_type}</td>
                                    <td className="actions">
                                        <div className="actions-inner">
                                            <button className="btn edit" onClick={() => handleEdit(rank)}>
                                                <FaEdit/>
                                            </button>
                                            <button
                                                className="btn delete"
                                                onClick={() => {
                                                    setDeleteId(rank.id);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                            >
                                                <FaTrashCan/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} style={{textAlign: 'center'}}>
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

            <AddEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editData}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                text="Unvonni o‘chirmoqchimisiz?"
                onCancel={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
            />
        </div>
    );
};

export default RankPage;
