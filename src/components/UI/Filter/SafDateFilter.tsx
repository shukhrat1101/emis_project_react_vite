import React from "react";
import "./SafDateFilter.scss";

type Props = {
    value: string;
    onChange: (v: string) => void;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const SafDateFilter: React.FC<Props> = ({ value, onChange }) => {
    return (
        <div className="safq-filter">
            <div className="safq-filter-row">
                <label className="safq-label">Sana</label>
                <input className="safq-date" type="date" value={value} onChange={(e) => onChange(e.target.value)} />
                <button className="safq-today-btn" type="button" onClick={() => onChange(todayISO())}>
                    Bugun
                </button>
            </div>
        </div>
    );
};

export default SafDateFilter;
