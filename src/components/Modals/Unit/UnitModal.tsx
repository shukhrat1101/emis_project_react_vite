import React, { useEffect, useState } from "react";
import Select, { SingleValue } from "react-select";
import "./UnitModal.scss";
import "../Modal.scss";
import unitService from "../../../services/unitService";
import { RiImageAddFill } from "react-icons/ri";

interface Unit {
    id: number;
    name: string;
}

interface OptionType {
    value: number;
    label: string;
}

interface AddEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData) => void | Promise<void>;
    initialData?: {
        id?: number;
        name: string;
        address: string;
        parent_id?: number | string | null;
        image?: string;
    };
}

const AddEditModal: React.FC<AddEditModalProps> = ({
                                                       isOpen,
                                                       onClose,
                                                       onSubmit,
                                                       initialData,
                                                   }) => {
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [parentId, setParentId] = useState<OptionType | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [unitOptions, setUnitOptions] = useState<OptionType[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        (async () => {
            try {
                const data: Unit[] = await unitService.getAllUnits();
                const options = data.map((u) => ({ value: u.id, label: u.name }));
                setUnitOptions(options);
            } catch {
                setUnitOptions([]);
            }
        })();
    }, [isOpen]);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name ?? "");
            setAddress(initialData.address ?? "");
            setImageFile(null);
        } else {
            setName("");
            setAddress("");
            setParentId(null);
            setImageFile(null);
        }
    }, [initialData, isOpen]);

    useEffect(() => {
        const pid = initialData?.parent_id;
        if (!unitOptions.length) return;
        if (pid === undefined || pid === null || pid === "") {
            setParentId(null);
            return;
        }
        const pidNum = typeof pid === "string" ? Number(pid) : pid;
        if (Number.isNaN(pidNum)) {
            setParentId(null);
            return;
        }
        const found = unitOptions.find((o) => o.value === pidNum) || null;
        setParentId(found);
    }, [unitOptions, initialData?.parent_id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("name", name);
        formData.append("address", address);
        if (parentId) formData.append("parent_id", String(parentId.value));
        if (imageFile) formData.append("image", imageFile);
        await onSubmit(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="add-edit-modal-overlay">
            <div className="add-edit-modal">
                <h3>{initialData ? "Tahrirlash" : "Birlashma qo‘shish"}</h3>
                <form onSubmit={handleSubmit} className="form">
                    <label>Birlashma nomi</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <label>Manzil</label>
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                    />

                    <label>Asosiy birlashma</label>
                    <Select
                        options={unitOptions}
                        value={parentId}
                        onChange={(opt: SingleValue<OptionType>) => setParentId(opt ?? null)}
                        placeholder="Asosiy birlashmani tanlang"
                        isClearable
                        className="react-select-container"
                        classNamePrefix="react-select"
                    />

                    <div className="image-upload-container">
                        <label htmlFor="image-upload" className="image-upload-icon">
                            <RiImageAddFill />
                        </label>
                        <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                        />
                        <div className="image-preview">
                            {imageFile ? (
                                <img src={URL.createObjectURL(imageFile)} alt="Yangi rasm" />
                            ) : initialData?.image ? (
                                <img src={initialData.image} alt="Eski rasm" />
                            ) : null}
                        </div>
                    </div>

                    <div className="modal-buttons">
                        <button type="submit" className="submit">
                            {initialData ? "Saqlash" : "Qo‘shish"}
                        </button>
                        <button type="button" className="cancel" onClick={onClose}>
                            Bekor qilish
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEditModal;
