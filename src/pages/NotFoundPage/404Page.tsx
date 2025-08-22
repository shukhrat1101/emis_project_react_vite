import React from "react";
import { Link } from "react-router-dom";
import "./404Page.scss";

const NotFoundPage: React.FC = () => {
    return (
        <main className="nf-root">
            <span className="nf-blob nf-blob--1" />
            <span className="nf-blob nf-blob--2" />
            <span className="nf-blob nf-blob--3" />

            <section className="nf-card">
                <div className="nf-code" aria-hidden="true">404</div>
                <h1 className="nf-title">Sahifa topilmadi</h1>
                <p className="nf-desc">
                    Kechirasiz, bu manzil mavjud emas yoki uni ko‘rish uchun ruxsat yo‘q!!!
                </p>

                <div className="nf-actions">
                    <Link className="nf-btn nf-btn--primary" to="/dashboard">
                        Bosh sahifaga o‘tish
                    </Link>
                    <button
                        className="nf-btn nf-btn--ghost"
                        onClick={() => window.history.back()}
                        type="button"
                    >
                        Orqaga qaytish
                    </button>
                </div>
            </section>
        </main>
    );
};

export default NotFoundPage;
