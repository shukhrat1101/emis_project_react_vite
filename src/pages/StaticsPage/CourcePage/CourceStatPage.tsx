import React, { useEffect, useState } from "react";
import { FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import courseService, { Course } from "../../../services/courseService";
import Pagination from "../../../components/UI/Pagination";
import Loader from "../../../components/UI/Loader";
import SearchBar from "../../../components/UI/Search";
import YearFilter from "../../../components/UI/Filter/YearFilter";

import "../../InfoPages/CoursePage/CoursePage.scss";
import "../../../style/global.scss";

const TOAST = {
    LOAD_ERR: "course-stat-load-error",
};

const CourseStatPage: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [total, setTotal] = useState(0);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [yearFilter, setYearFilter] = useState<{ year_id?: number | null; year?: string | null }>({
        year_id: null,
        year: null,
    });

    const navigate = useNavigate();

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const res = await courseService.list({
                page,
                page_size: pageSize,
                search,
                year: yearFilter.year ? String(yearFilter.year).replace("–", "-") : undefined,
            });
            setCourses(res?.results || []);
            setTotal(res?.total || 0);
        } catch {
            toast.error("Kurslarni yuklashda xatolik!", { toastId: TOAST.LOAD_ERR });
            setCourses([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [page, pageSize, search, yearFilter]);

    const handleViewStudents = (id: number) => {
        navigate(`/kurs/${id}/oquvchilar`);
    };

    return (
        <div className="course-page">
            <div className="header">
                <h2 className="title">Kurslar ro‘yxati</h2>
                <div
                    className="header-controls"
                    style={{
                        marginLeft: "auto",
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                        maxWidth: "100%",
                    }}
                >
                    <YearFilter
                        value={yearFilter}
                        onChange={(v) => {
                            setYearFilter(v);
                            setPage(1);
                        }}
                    />
                    <div style={{ flex: "0 1 320px", minWidth: 240 }}>
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
                            <th>Kurs nomi</th>
                            <th>O‘tkazish joyi</th>
                            <th>Sana</th>
                            <th>O‘quv yili</th>
                            <th>Tinglovchilar soni</th>
                            <th>Tinglovchilar</th>
                        </tr>
                        </thead>
                        <tbody>
                        {Array.isArray(courses) && courses.length > 0 ? (
                            courses.map((row, index) => (
                                <tr key={row.id}>
                                    <td>{(page - 1) * pageSize + index + 1}</td>
                                    <td>{row.course_name}</td>
                                    <td>{row.course_place}</td>
                                    <td>
                                        {row.start_date} / {row.end_date}
                                    </td>
                                    <td>{row.course_year}</td>
                                    <td>{row.student_count}</td>
                                    <td>
                                        <button
                                            className="btn detail"
                                            onClick={() => handleViewStudents(row.id)}
                                            title="Kurs o‘quvchilari"
                                        >
                                            <FaEye /> Tinglovchilarni ko‘rish
                                        </button>
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
        </div>
    );
};

export default CourseStatPage;
