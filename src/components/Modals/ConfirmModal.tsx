import React from "react";
import "./ConfirmModal.scss";

interface ConfirmModalProps {
  isOpen: boolean;
  text: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  text,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal">
        <p>{text}</p>
        <div className="confirm-modal-buttons">
          <button onClick={onConfirm} className="confirm">Ha</button>
          <button onClick={onCancel} className="cancel">Bekor qilish</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
