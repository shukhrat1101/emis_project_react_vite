import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { IoMdAddCircle } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Loader from "../../../components/UI/Loader";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import CompetitionResultModal, {
  CompetitionResultInitial,
} from "../../../components/Modals/Competition/CompetitionResultModal";
import competitionResultService, {
  CompetitionResult,
} from "../../../services/competitionResultService";

import "./CompetitionResultPage.scss";
import "../../../style/global.scss";

const TOAST = {
  LOAD_ERR: "cresult-load-error",
  CREATE_OK: "cresult-create-ok",
  UPDATE_OK: "cresult-update-ok",
  DELETE_OK: "cresult-delete-ok",
  ACTION_ERR: "cresult-action-error",
};

const MAX_TITLE_CHARS = 60;
const truncate = (s: string, n = MAX_TITLE_CHARS) =>
  s && s.length > n ? s.slice(0, n) + "…" : s;

function extractFilename(url: string) {
  try {
    const u = new URL(url);
    const seg = u.pathname.split("/").filter(Boolean).pop() || "";
    return decodeURIComponent(seg);
  } catch {
    const seg = url.split("/").filter(Boolean).pop() || "";
    return decodeURIComponent(seg);
  }
}

function displayNameFromUrl(url?: string | null) {
  if (!url) return "—";
  const name = extractFilename(url);
  return name || "fayl";
}

const CompetitionResultPage: React.FC = () => {
  const { id } = useParams();
  const competitionId = id ? Number(id) : undefined;

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompetitionResult | null>(null);
  const [competitionName, setCompetitionName] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const titleFull = competitionName || "";
  const titleShort = useMemo(() => truncate(titleFull), [titleFull]);

  const load = async () => {
    if (!competitionId) return;
    try {
      setLoading(true);
      // API returns an array; we assume single result per competition
      const list = await competitionResultService.listByCompetition(competitionId, {
        page: 1,
        page_size: 100,
      });
      const first = Array.isArray(list) ? list[0] : null;
      setResult(first ?? null);
      // take competition title from payload if present
      if (first?.competition) setCompetitionName(first.competition);
      else setCompetitionName("");
    } catch {
      toast.error("Natijalarni yuklashda xatolik!", { toastId: TOAST.LOAD_ERR });
      setResult(null);
      setCompetitionName("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [competitionId]);

  const openCreate = () => setIsModalOpen(true);
  const openEdit = () => setIsModalOpen(true);

  const handleSubmit = async (fd: FormData) => {
    if (!competitionId) return;
    try {
      const summary = (fd.get("summary") as string) ?? "";
      const suggestions = (fd.get("suggestions") as string) ?? "";
      const resultFile = (fd.get("result_file") as File) || undefined;

      if (result?.id) {
        await competitionResultService.update(result.id, {
          summary,
          suggestions,
          result_file: resultFile,
        });
        toast.success("Ma'lumot yangilandi!", { toastId: TOAST.UPDATE_OK });
      } else {
        await competitionResultService.create({
          competition: competitionId,
          summary,
          suggestions,
          result_file: resultFile,
        });
        toast.success("Ma'lumot saqlandi!", { toastId: TOAST.CREATE_OK });
      }
      await load();
    } catch {
      toast.error("Saqlashda xatolik yuz berdi!", { toastId: TOAST.ACTION_ERR });
    } finally {
      setIsModalOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!result?.id) return;
    try {
      await competitionResultService.delete(result.id);
      toast.success("Ma'lumot o‘chirildi!", { toastId: TOAST.DELETE_OK });
      setResult(null);
    } catch {
      toast.error("O‘chirishda xatolik yuz berdi!", { toastId: TOAST.ACTION_ERR });
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const initialData: CompetitionResultInitial | undefined = result
    ? {
        id: result.id,
        result_file: result.result_file || undefined,
        summary: result.summary,
        suggestions: result.suggestions,
      }
    : undefined;

  return (
    <div className="competition-result-page">
      <div className="header">
        <h2
          className="title"
          title={titleFull ? `Musobaqa: ${titleFull}` : undefined}
        >
          {titleFull ? titleShort : ""}
        </h2>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <>
          {!result ? (
            <div className="empty-state">
              <button className="add-big" onClick={openCreate}>
                <IoMdAddCircle /> Natijalarni qo‘shish
              </button>
            </div>
          ) : (
            <div className="content">
              <div className="cards">
                <div className="card">
                  <div className="card-title">Xulosa:</div>
                  <div className="card-body">{result.summary || "—"}</div>
                </div>
                <div className="card">
                  <div className="card-title">Taklif:</div>
                  <div className="card-body">{result.suggestions || "—"}</div>
                </div>
              </div>

              <div className="file-tile">
                <div className="label">Hujjat:</div>
                {result.result_file ? (
                  <a
                    className="file-link"
                    href={result.result_file}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={displayNameFromUrl(result.result_file)}
                    title={displayNameFromUrl(result.result_file)}
                  >
                    {displayNameFromUrl(result.result_file)}
                  </a>
                ) : (
                  <span className="file-none">Fayl biriktirilmagan</span>
                )}
              </div>

              <div className="actions-bottom">
                <button className="btn edit" onClick={openEdit}>
                  <FaEdit /> Tahrirlash
                </button>
                <button
                  className="btn delete"
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  <FaTrashCan /> O‘chirish
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <CompetitionResultModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={initialData}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        text="Natijani o‘chirmoqchimisiz?"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default CompetitionResultPage;
