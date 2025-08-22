import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import commandService, { CommandDoc } from "../../../services/commandService";
import Pagination from "../../../components/UI/Pagination";
import Loader from "../../../components/UI/Loader";


import "../../InfoPages/CommandPage/CommandPage.scss";
import "../../../style/global.scss";
import "./CommandStatPage.scss";
import SearchBar from "../../../components/UI/Search";
import {FaFileDownload, FaFilePdf} from "react-icons/fa";

const TOAST = {
    LOAD_ERR: "commandstat-load-error",
};

const fmtDate = (s?: string) => {
    if (!s) return "—";
    try {
        return new Date(s).toLocaleDateString("uz-UZ");
    } catch {
        return s;
    }
};

const CommandStatPage: React.FC = () => {
    const [items, setItems] = useState<CommandDoc[]>([]);
    const [total, setTotal] = useState(0);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchList = async () => {
        try {
            setLoading(true);
            const res = await commandService.list(page, pageSize, search || undefined);
            setItems(res?.results || []);
            setTotal(res?.total || 0);
        } catch {
            setItems([]);
            setTotal(0);
            toast.error("Buyruqlarni yuklashda xatolik!", { toastId: TOAST.LOAD_ERR });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, [page, pageSize, search]);

    return (
        <div className="command-page">
            <div className="header header--with-search">
                <h2 className="title">Rahbariy hujjatlar ro‘yxati</h2>

                <SearchBar
                    className="command-search"
                    placeholder="Qidiruv..."
                    initialValue={search}
                    onSearch={(q) => {
                        setSearch(q);
                        setPage(1);
                    }}
                />
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
                        </tr>
                        </thead>
                        <tbody>
                        {Array.isArray(items) && items.length > 0 ? (
                            items.map((row, index) => (
                                <tr key={row.id}>
                                    <td>{(page - 1) * pageSize + index + 1}</td>
                                    <td>{row.name || "—"}</td>
                                    <td>{row.number || "—"}</td>
                                    <td>{fmtDate(row.created_at)}</td>
                                    <td>{row.author || "—"}</td>
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
                                                <FaFilePdf size={24} style={{ color: "#dc9a37" }} />
                                            </a>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center" }}>
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
        </div>
    );
};

export default CommandStatPage;
