import React from "react";
import {ContingentTable, UnitItem} from "../../../services/partofunitService";
import "../Shtat/ShtatModal.scss"

interface PartDetailModalProps {
  open: boolean;
  onClose: () => void;
  unit: UnitItem | null;
}

const PartDetailModal: React.FC<PartDetailModalProps> = ({ open, onClose, unit }) => {
  if (!open || !unit) return null;

  const rows: ContingentTable[] = unit.shtat?.contingent_tables ?? [];

  return (
    <div className="shtat-detail-overlay" onClick={onClose}>
      <div className="shtat-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shtat-detail-header">
          <h3>Shtat tarkibi</h3>
          <button className="shtat-detail-close-btn" onClick={onClose}>×</button>
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
            {rows.map((row, idx) => (
              <tr key={row.id ?? idx}>
                <td>{idx + 1}</td>
                <td>{row.type}</td>
                <td>{row.count_person} kishi</td>
                <td>
                  <ul>
                    {(row.position ?? []).map((p) => (
                      <li key={p.id}>{p.name}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center" }}>Ma’lumot yo‘q</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PartDetailModal;
