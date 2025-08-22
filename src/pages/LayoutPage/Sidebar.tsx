import { ChevronDown } from "lucide-react";
import { BiLogOut, BiSolidInfoSquare } from "react-icons/bi";
import React, { useEffect, useMemo, useState, type ComponentType } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/emis.png";
import { logout } from "../../services/authService";
import "./Sidebar.scss";
import { RiBuilding2Fill } from "react-icons/ri";
import ConfirmModal from "../../components/Modals/ConfirmModal";
import { TbMilitaryRankFilled } from "react-icons/tb";
import { FaGrip, FaRegAddressCard, FaTrophy, FaHouseFlag, FaUserGroup } from "react-icons/fa6";
import { FaBookReader, FaNewspaper, FaUsers } from "react-icons/fa";
import { IoDesktop, IoDocument } from "react-icons/io5";
import { GiLaurelsTrophy, GiTeacher } from "react-icons/gi";
import { BsPersonVcardFill } from "react-icons/bs";
import userService, { type CurrentUser } from "../../services/userService";
import { SiGooglecloudcomposer } from "react-icons/si";
import { PiUserListFill } from "react-icons/pi";
import { HiUserGroup } from "react-icons/hi";

type LeafItem = {
    label: string;
    path: string;
    icon?: ComponentType<{ size?: number }>;
};

type GroupItem = {
    label: string;
    key: string;
    icon?: ComponentType<{ size?: number }>;
    children: (LeafItem | GroupItem)[];
};

type MenuNode = LeafItem | GroupItem;

const Sidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
    const [showModal, setShowModal] = useState(false);
    const [me, setMe] = useState<CurrentUser | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await userService.me();
                setMe(data);
            } catch {
                setMe(null);
            }
        })();
    }, []);

    const isActive = (path: string) => location.pathname.startsWith(path);

    const levelLabel =
        me?.role === "superadmin"
            ? "Strategik bo‘g‘in"
            : me?.role === "admin"
                ? "Operativ bo‘g‘in"
                : "Taktik bo‘g‘in";

    const LEVEL_MENU: MenuNode[] = useMemo(
        () => [
            { label: "Tadqiqotlar", path: "/tadqiqot", icon: FaGrip },
            { label: "O`quvlar", path: "/oquvlar", icon: GiTeacher },
            { label: "Shtat tuzilmasi", path: "/bioshtat", icon: HiUserGroup },
            { label: "Saf qaydnomasi", path: "/safqaydnomasi", icon: PiUserListFill },
            { label: "Instrumental texnologik baza", path: "/texnologikbaza", icon: SiGooglecloudcomposer },
        ],
        []
    );

    const FULL_INFO_MENU: MenuNode[] = useMemo(
        () => [
            { label: "Foydalanuvchilar", path: "/malumotnoma/foydalanuvchi", icon: FaUsers },
            { label: "Bo`linmalar", path: "/malumotnoma/birlashma", icon: RiBuilding2Fill },
            { label: "Unvonlar", path: "/malumotnoma/unvonlar", icon: TbMilitaryRankFilled },
            { label: "Lavozimlar", path: "/malumotnoma/lavozimlar", icon: FaRegAddressCard },
            { label: "Shtat tuzulmasi", path: "/malumotnoma/shtat", icon: FaGrip },
            { label: "Kurslar", path: "/malumotnoma/kurs", icon: FaBookReader },
            { label: "Musobaqalar", path: "/malumotnoma/konkurs", icon: FaTrophy },
            { label: "Harbiy xizmatchilar", path: "/malumotnoma/militarymen", icon: FaUserGroup },
            { label: "Rahbariy hujjatlar", path: "/malumotnoma/rahbariy_hujjat", icon: IoDocument },
            { label: "Yangiliklar", path: "/malumotnoma/yangiliklar", icon: FaNewspaper },
            {
                label: "O‘quv",
                key: "oquv",
                icon: FaHouseFlag,
                children: [
                    { label: "O‘quv yillari", path: "/malumotnoma/oquv/oquv-yillari" },
                    { label: "O‘quv va tadqiqotlar", path: "/malumotnoma/oquv/oquv-tadqiqotlar" },
                ],
            },
        ],
        []
    );

    const LIMITED_INFO_MENU: MenuNode[] = useMemo(
        () => [{ label: "O‘quv va tadqiqotlar", path: "/malumotnoma/oquv/oquv-tadqiqotlar", icon: FaHouseFlag }],
        []
    );

    const CAN_SHOW_INFO = me?.role === "superadmin" || (me?.role === "admin" && me?.can_crud === true);

    const INFO_MENU: MenuNode[] = useMemo(() => {
        if (me?.role === "superadmin") return FULL_INFO_MENU;
        if (me?.role === "admin" && me?.can_crud) return LIMITED_INFO_MENU;
        return [];
    }, [me?.role, me?.can_crud, FULL_INFO_MENU, LIMITED_INFO_MENU]);

    const go = (path: string) => {
        navigate(path);

        setOpenGroups((prev) => {
            const inLevelMenu = LEVEL_MENU.some((n) => "path" in n && path.startsWith((n as LeafItem).path));
            const next = { ...prev };

            if (!inLevelMenu) next["root-level"] = false;
            if (!path.startsWith("/malumotnoma")) next["root-info"] = false;

            return next;
        });
    };

    useEffect(() => {
        const next: Record<string, boolean> = { ...openGroups };

        const levelActive = LEVEL_MENU.some((n) => ("path" in n ? isActive(n.path) : false));
        if (levelActive) next["root-level"] = true;

        if (CAN_SHOW_INFO && INFO_MENU.length > 0) {
            const hasActiveDescendant = (nodes: MenuNode[]): boolean => {
                for (const n of nodes) {
                    if ("children" in n) {
                        if (hasActiveDescendant(n.children)) return true;
                    } else if ("path" in n && isActive(n.path)) {
                        return true;
                    }
                }
                return false;
            };
            if (hasActiveDescendant(INFO_MENU)) next["root-info"] = true;
        } else {
            next["root-info"] = false;
        }

        setOpenGroups(next);
    }, [location.pathname, CAN_SHOW_INFO, INFO_MENU, LEVEL_MENU]);

    const toggleGroup = (key: string) => setOpenGroups((p) => ({ ...p, [key]: !p[key] }));

    const hasActive = (nodes: MenuNode[]): boolean => {
        for (const n of nodes) {
            if ("children" in n) {
                if (hasActive(n.children)) return true;
            } else if (isActive(n.path)) {
                return true;
            }
        }
        return false;
    };

    const renderNodes = (nodes: MenuNode[], nested = false) => {
        return (
            <div className={`submenu${nested ? " nested" : ""}`}>
                {nodes.map((n, idx) => {
                    if ("children" in n) {
                        const Icon = n.icon;
                        const opened = !!openGroups[n.key];
                        const groupActive = hasActive(n.children);
                        return (
                            <div key={`${n.key}-${idx}`} className={`submenu-group ${groupActive ? "active" : ""}`}>
                                <button
                                    className="submenu-item with-arrow"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleGroup(n.key);
                                    }}
                                >
                                    {Icon ? <Icon size={20} /> : null}
                                    <span>{n.label}</span>
                                    <ChevronDown size={14} className={`arrow-icon ${opened ? "rotate" : ""}`} />
                                </button>
                                {opened && renderNodes(n.children, true)}
                            </div>
                        );
                    } else {
                        const Icon = n.icon;
                        return (
                            <button
                                key={`${n.path}-${idx}`}
                                className={`submenu-item ${isActive(n.path) ? "active" : ""}`}
                                onClick={() => go(n.path)}
                            >
                                {Icon ? <Icon size={20} /> : null}
                                <span>{n.label}</span>
                            </button>
                        );
                    }
                })}
            </div>
        );
    };

    const confirmLogout = async () => {
        setShowModal(false);
        await logout();
    };

    return (
        <>
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <img src={logo} alt="E-MIS Logo" />
                    <span className="logo-text">E-MIS</span>
                </div>

                <div className="sidebar-menu">
                    <button className={`sidebar-item ${isActive("/dashboard") ? "active" : ""}`} onClick={() => go("/dashboard")}>
                        <IoDesktop size={20} />
                        <span>Bosh sahifa</span>
                    </button>

                    <button className={`sidebar-item ${isActive("/yangiliklar") ? "active" : ""}`} onClick={() => go("/yangiliklar")}>
                        <FaNewspaper size={20} />
                        <span>Yangiliklar</span>
                    </button>

                    <button className={`sidebar-item ${isActive("/kurslar") ? "active" : ""}`} onClick={() => go("/kurslar")}>
                        <BsPersonVcardFill size={20} />
                        <span>Mutaxassislarni tayyorlash</span>
                    </button>

                    <button className={`sidebar-item ${isActive("/musobaqalar") ? "active" : ""}`} onClick={() => go("/musobaqalar")}>
                        <GiLaurelsTrophy size={20} />
                        <span>Musobaqalar</span>
                    </button>

                    <button className={`sidebar-item ${isActive("/document") ? "active" : ""}`} onClick={() => go("/document")}>
                        <IoDocument size={20} />
                        <span>Rahbariy hujjatlar</span>
                    </button>

                    <button
                        className={`sidebar-item ${openGroups["root-level"] ? "active" : ""}`}
                        onClick={() => toggleGroup("root-level")}
                    >
                        <FaHouseFlag size={20} />
                        <span>{levelLabel}</span>
                        <ChevronDown size={16} className={`arrow-icon ${openGroups["root-level"] ? "rotate" : ""}`} />
                    </button>
                    {openGroups["root-level"] && renderNodes(LEVEL_MENU, false)}

                    {CAN_SHOW_INFO && INFO_MENU.length > 0 && (
                        <>
                            <button
                                className={`sidebar-item ${location.pathname.startsWith("/malumotnoma") ? "active" : ""}`}
                                onClick={() => toggleGroup("root-info")}
                            >
                                <BiSolidInfoSquare size={20} />
                                <span>Ma`lumotnoma</span>
                                <ChevronDown size={16} className={`arrow-icon ${openGroups["root-info"] ? "rotate" : ""}`} />
                            </button>
                            {openGroups["root-info"] && renderNodes(INFO_MENU, false)}
                        </>
                    )}
                </div>

                <button className="sidebar-item logout" onClick={() => setShowModal(true)}>
                    <BiLogOut size={20} />
                    <span>Chiqish</span>
                </button>
            </aside>

            {showModal && (
                <ConfirmModal
                    isOpen={showModal}
                    text="Siz tizimdan chiqmoqchimisiz?"
                    onConfirm={confirmLogout}
                    onCancel={() => setShowModal(false)}
                />
            )}
        </>
    );
};

export default Sidebar;
