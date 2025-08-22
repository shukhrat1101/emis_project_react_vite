import React, { FC, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import "./AuthPage.scss";
import BackgroundAnimation from "../../components/animations/BackgroundAnimation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { login } from "../../services/authService";
import {useNavigate} from "react-router-dom";

const LoginSchema = Yup.object().shape({
    username: Yup.string().required("Foydalanuvchi nomi majburiy"),
    password: Yup.string().required("Parol majburiy"),
});

const LoginPages: FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (values: { username: string; password: string }) => {
        try {
            setErrorMessage(null);
            await login(values.username, values.password);
            navigate("/dashboard", { replace: true });
        } catch {
            setErrorMessage("Foydalanuvchi nomi yoki parol xato!");
        }
    };

    const clearErrorOnFocus = () => {
        if (errorMessage) setErrorMessage(null);
    };

    return (
        <div className="auth-page">
            <BackgroundAnimation />

            <div className="auth-container">
                <div className="auth-left">
                    <h2>Tizimga kirish</h2>

                    <Formik
                        initialValues={{ username: "", password: "" }}
                        validationSchema={LoginSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ values, isSubmitting }) => (
                            <Form className="login-form">
                                <div className={`form-group ${values.username ? "filled" : ""}`}>
                                    <Field
                                        type="text"
                                        name="username"
                                        placeholder=" "
                                        autoComplete="off"
                                        onFocus={clearErrorOnFocus}
                                    />
                                    <label>Foydalanuvchi nomi</label>
                                    <ErrorMessage name="username" component="div" className="error" />
                                </div>

                                <div className={`form-group password-field ${values.password ? "filled" : ""}`}>
                                    <Field
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder=" "
                                        autoComplete="off"
                                        onFocus={clearErrorOnFocus}
                                    />
                                    <label>Parol</label>
                                    <span
                                        className="toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                        role="button"
                                        aria-label="Parolni ko‘rsatish/yashirish"
                                    >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </span>
                                    <ErrorMessage name="password" component="div" className="error" />
                                </div>

                                {errorMessage && (
                                    <div className="login-error" aria-live="polite">
                                        {errorMessage}
                                    </div>
                                )}

                                <button type="submit" disabled={isSubmitting}>Kirish</button>
                            </Form>
                        )}
                    </Formik>
                </div>

                <div className="auth-right"></div>
            </div>
        </div>
    );
};

export default LoginPages;
