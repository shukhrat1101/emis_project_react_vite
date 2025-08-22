import React, { useEffect, useState } from "react";
import "./Header.scss";
import ProfileModal from "../../components/Modals/User/ProfileModal";
import userService, { CurrentUser } from "../../services/userService";
import { FaUserCircle } from "react-icons/fa";

const Header: React.FC = () => {
    const [me, setMe] = useState<CurrentUser | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const data = await userService.me();
                setMe(data ?? null);
            } catch {
                setMe(null);
            }
        })();
    }, []);

    return (
        <header className="dashboard-header">
            <div className="greeting" />
            <div className="header-right">
                <button
                    className="header-avatar-btn"
                    onClick={() => setOpen(true)}
                    aria-label="Profil"
                    title={me?.full_name || me?.username || "Profil"}
                >
                    {me?.image ? (
                        <img className="header-avatar-img" src={me.image} alt="avatar" />
                    ) : (
                        <FaUserCircle className="header-avatar-icon" />
                    )}
                </button>
            </div>

            <ProfileModal
                isOpen={open}
                onClose={() => setOpen(false)}
                userId={me?.id ?? null}
                canEdit
            />
        </header>
    );
};

export default Header;
