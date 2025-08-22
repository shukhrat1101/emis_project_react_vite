import React from "react";
import "./DetailModal.scss";


interface Position {
    id: number;
    name: string;
}

interface PositionData {
    id: number;
    type: string;
    count_person: number;
    position: Position[];
}

interface DetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    positions?: PositionData[];
}


const DetailModal: React.FC<DetailModalProps> = ({
                                                     isOpen,
                                                     onClose,
                                                     positions = [],
                                                 }) => {
    if (!isOpen) return null;

    return (
        <div className="shtat-detail-overlay" onClick={onClose}>
            <div className="shtat-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="shtat-detail-header">
                    <h3>Shtat tarkibi</h3>
                    <button className="shtat-detail-close-btn" onClick={onClose}>
                        &times;
                    </button>
                </div>

                <table className="shtat-detail-table">
                    <thead>
                    <tr>
                        <th>T/r</th>
                        <th>Harbiy unvon</th>
                        <th>Soni</th>
                        <th>Lavozimlar</th>
                    </tr>
                    </thead>
                    <tbody>
                    {positions.map((item, index) => (
                        <tr key={item.id}>
                            <td>{index + 1}</td>
                            <td>{item.type}</td>
                            <td>{item.count_person} kishi</td>
                            <td>
                                <ul>
                                    {(item.position || []).map((pos, i) => {
                                        console.log("Lavozim:", JSON.stringify(pos, null, 2)); // ✅ To‘g‘ri ko‘rsatadi
                                        return <li key={i}>{pos.name}</li>;
                                    })}
                                </ul>
                            </td>


                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DetailModal;
