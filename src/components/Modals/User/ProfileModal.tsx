import React, {useEffect, useMemo, useRef, useState} from "react";
import userService, {ProfileUpdatePayload, UserProfile} from "../../../services/userService";
import "../Modal.scss";
import "./ProfileModal.scss";
import RankLazySelect, {Option as RankOption} from "../../AsyncSelects/RankLazySelect";
import PositionLazySelect, {Option as PosOption} from "../../AsyncSelects/PositionLazySelect";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    userId: number | string | null;
    canEdit?: boolean;
};

const fmtDT = (s?: string | null) => {
    if (!s) return "—";
    try {
        return new Date(s).toLocaleString("uz-UZ");
    } catch {
        return s || "—";
    }
};

const initials = (name?: string | null) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const ProfileModal: React.FC<Props> = ({isOpen, onClose, userId, canEdit = false}) => {
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [editMode, setEditMode] = useState(false);

    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [passport, setPassport] = useState("");

    const [rankOpt, setRankOpt] = useState<RankOption | null>(null);
    const [posOpt, setPosOpt] = useState<PosOption | null>(null);

    const [imgFile, setImgFile] = useState<File | null>(null);
    const fileRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            if (!isOpen || userId == null) return;
            try {
                setLoading(true);
                const data = await userService.getProfile(userId);
                if (!cancelled) {
                    setProfile(data);
                    setEditMode(false);
                    setFullName(data.full_name || "");
                    setPhone(data.phone_number || "");
                    setPassport(data.passport_id || "");
                    setRankOpt(null);
                    setPosOpt(null);
                    setImgFile(null);
                    if (fileRef.current) fileRef.current.value = "";
                }
            } catch {
                if (!cancelled) setProfile(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [isOpen, userId]);

    const imgPreview = useMemo(() => (imgFile ? URL.createObjectURL(imgFile) : null), [imgFile]);

    if (!isOpen) return null;

    const openFileDialog = () => {
        if (!canEdit) return;
        fileRef.current?.click();
    };

    const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        setImgFile(f);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (userId == null) return;

        const payload: ProfileUpdatePayload = {};

        if (fullName !== (profile?.full_name || "")) payload.full_name = fullName;
        if (phone !== (profile?.phone_number || "")) payload.phone_number = phone;
        if (passport !== (profile?.passport_id || "")) payload.passport_id = passport;

        if (rankOpt?.value) payload.rank = Number(rankOpt.value);
        if (posOpt?.value) payload.position = Number(posOpt.value);

        if (imgFile) payload.image = imgFile;

        try {
            setLoading(true);
            if (Object.keys(payload).length === 0) {
                setEditMode(false);
            } else {
                await userService.updateProfile(userId, payload);
                const fresh = await userService.getProfile(userId);
                setProfile(fresh);
                setEditMode(false);
                setImgFile(null);
                if (fileRef.current) fileRef.current.value = "";
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <div
            className="profile-modal-overlay"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title">
                <h3 id="profile-title" className="profile-title">Foydalanuvchi profili</h3>

                <div
                    className={`profile-avatar ${canEdit ? "profile-avatar--clickable" : ""}`}
                    onClick={canEdit ? openFileDialog : undefined}
                    onKeyDown={(e) => {
                        if (!canEdit) return;
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openFileDialog();
                        }
                    }}
                    role={canEdit ? "button" : undefined}
                    tabIndex={canEdit ? 0 : -1}
                    aria-label={canEdit ? "Rasmni o‘zgartirish" : "Avatar"}
                    title={canEdit ? "Rasmni o‘zgartirish uchun bosing" : ""}
                >
                    {imgPreview ? (
                        <img className="profile-avatar-img" src={imgPreview} alt="preview"/>
                    ) : profile?.image ? (
                        <img className="profile-avatar-img" src={profile.image} alt={profile.full_name || "Avatar"}/>
                    ) : (
                        <div className="profile-avatar-fallback" aria-label="Avatar">
                            {initials(profile?.full_name)}
                        </div>
                    )}

                    {canEdit && <div className="profile-avatar-overlay"></div>}

                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="profile-file-input"
                        onChange={onPickImage}
                    />
                </div>

                {loading ? (
                    <div className="profile-loading">Yuklanmoqda...</div>
                ) : !editMode ? (
                    profile ? (
                        <>
                            <div className="profile-body">
                                <Row label="F.I.Sh.:" value={profile.full_name}/>
                                <Row label="Unvon:" value={profile.rank}/>
                                <Row label="Lavozim:" value={profile.position}/>
                                <Row label="Bo‘lim:" value={profile.department}/>
                                <Row label="Telefon:" value={profile.phone_number}/>
                                <Row label="Passport:" value={profile.passport_id}/>
                                <Row label="Yangilangan:" value={fmtDT(profile.updated_at)}/>
                            </div>

                            <div className="profile-buttons">
                                {canEdit && (
                                    <button className="btn-primary" onClick={() => setEditMode(true)}>
                                        Ma’lumotlarni tahrirlash
                                    </button>
                                )}
                                <button className="btn-close" onClick={onClose}>Yopish</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="profile-error">Ma’lumot topilmadi</div>
                            <div className="profile-buttons">
                                <button className="btn-close" onClick={onClose}>Yopish</button>
                            </div>
                        </>
                    )
                ) : (
                    <form className="profile-edit" onSubmit={submit}>
                        <div className="profile-edit-grid">
                            <label>F.I.Sh.</label>
                            <input
                                className="profile-input"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="To‘liq ism"
                            />

                            <label>Telefon</label>
                            <input
                                className="profile-input"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+9989..."
                            />

                            <label>Passport</label>
                            <input
                                className="profile-input"
                                value={passport}
                                onChange={(e) => setPassport(e.target.value)}
                                placeholder="AB1234567"
                            />

                            <label>Unvon</label>
                            <RankLazySelect
                                value={rankOpt}
                                onChange={setRankOpt}
                                placeholder={profile?.rank ? `${profile.rank}` : "Unvonni tanlang"}
                                pageSize={10}
                            />

                            <label>Lavozim</label>
                            <PositionLazySelect
                                value={posOpt}
                                onChange={setPosOpt}
                                placeholder={profile?.position ? `${profile.position}` : "Lavozimni tanlang"}
                                pageSize={10}
                            />
                        </div>

                        <div className="profile-buttons">
                            <button type="submit" className="btn-primary" disabled={loading}>Saqlash</button>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => {
                                    setEditMode(false);
                                    setImgFile(null);
                                    if (fileRef.current) fileRef.current.value = "";
                                }}
                            >
                                Bekor qilish
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

const Row: React.FC<{ label: string; value?: string | null }> = ({label, value}) => (
    <div className="profile-row">
        <div className="profile-row-label">{label}</div>
        <div className="profile-row-value">{value || "—"}</div>
    </div>
);

export default ProfileModal;
