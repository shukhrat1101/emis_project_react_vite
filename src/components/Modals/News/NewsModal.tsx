// src/components/Modals/News/NewsModal.tsx
import React, {useEffect, useRef, useState} from "react";
import {AiFillFileAdd} from "react-icons/ai";
import {RiImageAddFill} from "react-icons/ri";
import "../Modal.scss";
import "./NewsModal.scss";

export type NewsInitial = {
    id?: number;
    category?: number;
    category_name?: string;
    title?: string;
    content?: string;
    main_image_url?: string | null;
    journal_file_url?: string | null;
    additional_images_urls?: string[];
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (fd: FormData, id?: number) => void | Promise<void>;
    initialData?: NewsInitial;
};

const NewsModal: React.FC<Props> = ({isOpen, onClose, onSubmit, initialData}) => {
    const isEdit = Boolean(initialData?.id);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const [journalFile, setJournalFile] = useState<File | null>(null);
    const [images, setImages] = useState<File[]>([]);

    const [submitting, setSubmitting] = useState(false);

    const titleRef = useRef<HTMLTextAreaElement | null>(null);
    const journalRef = useRef<HTMLInputElement | null>(null);
    const imagesRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        setTitle(initialData?.title ?? "");
        setContent(initialData?.content ?? "");
        setJournalFile(null);
        setImages([]);
        setSubmitting(false);

        const t = setTimeout(() => titleRef.current?.focus(), 10);
        return () => clearTimeout(t);
    }, [isOpen, initialData?.id]);

    if (!isOpen) return null;

    const handleJournalPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        setJournalFile(e.target.files?.[0] || null);
    };

    const handleImagesPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files ? Array.from(e.target.files) : [];
        if (!picked.length) return;
        setImages((prev) => {
            const all = [...prev, ...picked];
            const key = (f: File) => `${f.name}-${f.size}-${(f as any).lastModified ?? 0}`;
            const map = new Map<string, File>();
            all.forEach((f) => map.set(key(f), f));
            return Array.from(map.values());
        });
        if (imagesRef.current) imagesRef.current.value = "";
    };

    const clearJournal = () => {
        setJournalFile(null);
        if (journalRef.current) journalRef.current.value = "";
    };

    const clearImages = () => {
        setImages([]);
        if (imagesRef.current) imagesRef.current.value = "";
    };

    const removeImageAt = (i: number) => {
        setImages((prev) => prev.filter((_, idx) => idx !== i));
    };

    const openJournalDialog = () => journalRef.current?.click();
    const openImagesDialog = () => imagesRef.current?.click();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const categoryVal = initialData?.category; // avtomatik
        const fd = new FormData();
        if (typeof categoryVal === "number") {
            fd.append("category", String(categoryVal));
        }
        fd.append("title", title.trim());
        fd.append("content", content.trim());
        if (journalFile instanceof File) fd.append("journal_file", journalFile);
        if (images.length) images.forEach((f) => fd.append("additional_images", f));

        setSubmitting(true);
        try {
            await onSubmit(fd, initialData?.id);
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    const closeOnBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !submitting) onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape" && !submitting) onClose();
    };

    return (
        <div className="news-modal-overlay" onMouseDown={closeOnBackdrop} onKeyDown={handleKeyDown}>
            <div className="news-modal">
                <h3 className="news-title">{isEdit ? "Yangilikni tahrirlash" : "Yangilik qo‘shish"}</h3>

                <form className="news-form" onSubmit={handleSubmit}>
                    <div className="news-input-group">
                        <label>Sarlavha</label>
                        <textarea
                            ref={titleRef}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Sarlavha"
                            rows={2}
                            maxLength={250}
                            required
                        />
                    </div>

                    <div className="news-input-group">
                        <label>Kontent</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Matn..."
                            rows={6}
                            required
                        />
                    </div>

                    <div className="news-input-group">
                        <label>Jurnal fayl (ixtiyoriy)</label>
                        <input
                            ref={journalRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf"
                            onChange={handleJournalPick}
                            style={{display: "none"}}
                        />
                        <div className="news-filebar" role="group" aria-label="Jurnal fayl boshqaruvlari">
                            <button
                                type="button"
                                className="news-file-btn"
                                onClick={openJournalDialog}
                                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openJournalDialog()}
                                title="Jurnal fayl yuklash"
                                aria-label="Jurnal fayl yuklash"
                            >
                                <AiFillFileAdd/>
                            </button>

                            <span className="news-file-name">
                {journalFile
                    ? journalFile.name
                    : initialData?.journal_file_url
                        ? "Joriy fayl tanlangan (o‘zgartirish uchun chapdagi tugmani bosing)"
                        : "Fayl tanlanmagan"}
              </span>

                            {journalFile && (
                                <button type="button" className="news-file-clear" onClick={clearJournal}>
                                    Tozalash
                                </button>
                            )}
                        </div>

                        {!journalFile && initialData?.journal_file_url && (
                            <div className="news-hint">
                                Joriy fayl:{" "}
                                <a href={initialData.journal_file_url} target="_blank" rel="noreferrer">
                                    ochish
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="news-input-group">
                        <label>Qo‘shimcha rasmlar (ixtiyoriy)</label>
                        <input
                            ref={imagesRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImagesPick}
                            style={{display: "none"}}
                        />
                        <div className="news-filebar" role="group" aria-label="Rasm yuklash boshqaruvlari">
                            <button
                                type="button"
                                className="news-file-btn"
                                onClick={openImagesDialog}
                                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openImagesDialog()}
                                title="Rasmlar yuklash"
                                aria-label="Rasmlar yuklash"
                            >
                                <RiImageAddFill/>
                            </button>

                            <span className="news-file-name">
                {images.length
                    ? `${images.length} ta rasm tanlandi`
                    : initialData?.additional_images_urls?.length
                        ? `Joriy: ${initialData.additional_images_urls.length} ta rasm`
                        : "Rasm tanlanmagan"}
              </span>

                            {images.length > 0 && (
                                <button type="button" className="news-file-clear" onClick={clearImages}>
                                    Barchasini tozalash
                                </button>
                            )}
                        </div>

                        {images.length > 0 && (
                            <div className="news-chips">
                                {images.map((f, i) => (
                                    <span key={`${f.name}-${i}`} className="news-chip" title={f.name}>
                    {f.name}
                                        <button type="button" className="news-chip-remove"
                                                onClick={() => removeImageAt(i)}>
                      ×
                    </button>
                  </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="news-buttons">
                        <button
                            type="submit"
                            className="news-submit"
                            disabled={submitting || !title.trim() || !content.trim()}
                        >
                            {isEdit ? "Saqlash" : "Qo‘shish"}
                        </button>
                        <button type="button" className="news-cancel" onClick={onClose} disabled={submitting}>
                            Bekor qilish
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewsModal;
