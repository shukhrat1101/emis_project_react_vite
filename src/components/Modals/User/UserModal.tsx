// src/components/Modals/User/UserModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import "../Modal.scss";
import "./UserModal.scss";
import PartUnitLazySelect, { Option as DeptOption } from "../../AsyncSelects/PartUnitLazySelect";
import Select, { SingleValue } from "react-select";
import { FiEye, FiEyeOff } from "react-icons/fi";

export type UserInitial = {
    id?: number;
    username?: string;
    role?: "superadmin" | "admin" | "user" | string;
    department_id?: number | null;
    department_name?: string | null;
    can_crud?: boolean;
    is_active?: boolean;
    is_staff?: boolean;
    is_superuser?: boolean;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: any, id?: number) => void | Promise<void>;
    initialData?: UserInitial;
};

type RoleOption = { value: string; label: string };

const ROLE_OPTIONS: RoleOption[] = [
    { value: "superadmin", label: "Super Admin" },
    { value: "admin", label: "Admin" },
    { value: "user", label: "User" },
];

const UserModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const isEdit = Boolean(initialData?.id);

    const [username, setUsername] = useState("");
    const [role, setRole] = useState<RoleOption | null>(null);
    const [dept, setDept] = useState<DeptOption | null>(null);

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [changePass, setChangePass] = useState(false);

    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [canCrud, setCanCrud] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [isStaff, setIsStaff] = useState(false);
    const [isSuper, setIsSuper] = useState(false);

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        setUsername(initialData?.username ?? "");
        setRole(
            initialData?.role
                ? ROLE_OPTIONS.find((r) => r.value === initialData.role) ?? null
                : null
        );

        if (initialData?.department_id) {
            setDept({
                value: String(initialData.department_id),
                label: initialData.department_name
                    ? `${initialData.department_name}`
                    : `ID: ${initialData.department_id}`,
            });
        } else if (initialData?.department_name) {
            setDept({ value: "", label: initialData.department_name });
        } else {
            setDept(null);
        }

        setPassword("");
        setConfirm("");
        setChangePass(false);
        setShowPass(false);
        setShowConfirm(false);

        setCanCrud(Boolean(initialData?.can_crud));
        setIsActive(initialData?.is_active ?? true);
        setIsStaff(Boolean(initialData?.is_staff));
        setIsSuper(Boolean(initialData?.is_superuser));

        setSubmitting(false);
    }, [isOpen, initialData?.id]);

    const valid = useMemo(() => {
        const base = username.trim().length > 0 && role;
        if (!base) return false;

        if (isEdit) {
            if (!changePass) return true;
            return password.length >= 6 && password === confirm;
        }

        return !!dept && password.length >= 6 && password === confirm;
    }, [username, role, dept, password, confirm, isEdit, changePass]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!valid || !role) return;

        try {
            setSubmitting(true);

            if (isEdit && initialData?.id) {
                const payload: any = {
                    username: username.trim(),
                    role: role.value,
                    can_crud: canCrud,
                    is_active: isActive,
                    is_staff: isStaff,
                    is_superuser: isSuper,
                };
                if (dept?.value) payload.department = Number(dept.value);
                if (changePass && password) {
                    payload.password = password;
                    payload.confirm_password = confirm;
                }
                await onSubmit(payload, initialData.id);
            } else {
                await onSubmit({
                    username: username.trim(),
                    role: role.value,
                    department: Number(dept!.value),
                    password,
                    confirm_password: confirm,
                    can_crud: canCrud,
                });
            }

            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="user-modal-overlay"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !submitting) onClose();
            }}
        >
            <div className="user-modal">
                <h3 className="user-title">
                    {isEdit ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi qo‘shish"}
                </h3>

                <form className="user-form" onSubmit={handleSubmit}>
                    <label className="user-label">Foydalanuvchi nomi</label>
                    <input
                        className="user-input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Foydalanuvchi nomi"
                        required
                    />

                    <label className="user-label">Rol</label>
                    <Select<RoleOption, false>
                        classNamePrefix="react-select"
                        options={ROLE_OPTIONS}
                        value={role}
                        onChange={(opt: SingleValue<RoleOption>) => setRole(opt ?? null)}
                        placeholder="Rol tanlang"
                        isClearable
                    />

                    <label className="user-label">Bo‘lim</label>
                    <PartUnitLazySelect
                        value={dept}
                        onChange={setDept}
                        placeholder="Bo‘limni tanlang"
                        pageSize={10}
                    />

                    {isEdit ? (
                        <>
                            <label className="user-checkrow">
                                <input
                                    type="checkbox"
                                    checked={changePass}
                                    onChange={(e) => {
                                        setChangePass(e.target.checked);
                                        setPassword("");
                                        setConfirm("");
                                        setShowPass(false);
                                        setShowConfirm(false);
                                    }}
                                />
                                <span>Parolni o‘zgartirish</span>
                            </label>

                            {changePass && (
                                <>
                                    <label className="user-label">Yangi parol</label>
                                    <div className="user-password">
                                        <input
                                            className="user-input"
                                            type={showPass ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Kamida 6 ta belgi"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="user-eye"
                                            onClick={() => setShowPass((s) => !s)}
                                            aria-label={showPass ? "Parolni yashirish" : "Parolni ko‘rsatish"}
                                        >
                                            {showPass ? <FiEyeOff /> : <FiEye />}
                                        </button>
                                    </div>

                                    <label className="user-label">Yangi parolni tasdiqlash</label>
                                    <div className="user-password">
                                        <input
                                            className="user-input"
                                            type={showConfirm ? "text" : "password"}
                                            value={confirm}
                                            onChange={(e) => setConfirm(e.target.value)}
                                            placeholder="Parolni qayta kiriting"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="user-eye"
                                            onClick={() => setShowConfirm((s) => !s)}
                                            aria-label={showConfirm ? "Parolni yashirish" : "Parolni ko‘rsatish"}
                                        >
                                            {showConfirm ? <FiEyeOff /> : <FiEye />}
                                        </button>
                                    </div>

                                    {password && confirm && password !== confirm && (
                                        <div className="user-error">Parollar mos kelmadi</div>
                                    )}
                                </>
                            )}

                            <label className="user-checkrow">
                                <input
                                    type="checkbox"
                                    checked={canCrud}
                                    onChange={(e) => setCanCrud(e.target.checked)}
                                />
                                <span>CRUD huquqi berilsinmi?</span>
                            </label>

                            <label className="user-checkrow">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                />
                                <span>Faolmi?</span>
                            </label>
                        </>
                    ) : (
                        <>
                            <label className="user-label">Parol</label>
                            <div className="user-password">
                                <input
                                    className="user-input"
                                    type={showPass ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Kamida 6 ta belgi"
                                    required
                                />
                                <button
                                    type="button"
                                    className="user-eye"
                                    onClick={() => setShowPass((s) => !s)}
                                    aria-label={showPass ? "Parolni yashirish" : "Parolni ko‘rsatish"}
                                >
                                    {showPass ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>

                            <label className="user-label">Parolni tasdiqlash</label>
                            <div className="user-password">
                                <input
                                    className="user-input"
                                    type={showConfirm ? "text" : "password"}
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    placeholder="Parolni qayta kiriting"
                                    required
                                />
                                <button
                                    type="button"
                                    className="user-eye"
                                    onClick={() => setShowConfirm((s) => !s)}
                                    aria-label={showConfirm ? "Parolni yashirish" : "Parolni ko‘rsatish"}
                                >
                                    {showConfirm ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>

                            {password && confirm && password !== confirm && (
                                <div className="user-error">Parollar mos kelmadi</div>
                            )}
                        </>
                    )}

                    <div className="user-buttons">
                        <button type="submit" className="user-submit" disabled={!valid || submitting}>
                            Saqlash
                        </button>
                        <button type="button" className="user-cancel" onClick={onClose} disabled={submitting}>
                            Bekor qilish
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;
