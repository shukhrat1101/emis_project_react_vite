import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPages from "../pages/AuthPage/LoginPage";
import Dashboard from "../pages/HomePage/Dashboard";
import Layout from "../pages/LayoutPage/Layout";
import UnitPage from "../pages/InfoPages/UnitPage/UnitPage";
import DepartmentDetailPage from "../pages/InfoPages/UnitPage/UnitDetailPage";
import RankPage from "../pages/InfoPages/RankPage/RankPage";
import PositionPage from "../pages/InfoPages/PositionPage/PositionPage";
import ShtatPage from "../pages/InfoPages/ShtatPage/ShtatPage";
import TeachingYearPage from "../pages/InfoPages/TeachingPage/TeachingYearPage";
import TeachResearchPage from "../pages/InfoPages/TeachingPage/TeachResearchPage";
import TeachingBranchPage from "../pages/InfoPages/TeachingPage/TeachingBranch";
import TeachingResultPage from "../pages/InfoPages/TeachingPage/TeachingResultPage";
import CoursePage from "../pages/InfoPages/CoursePage/CoursePage";
import CompetitionPage from "../pages/InfoPages/CompetitionPage/CompetitionPage";
import CommandPage from "../pages/InfoPages/CommandPage/CommandPage";
import ServicemanPage from "../pages/InfoPages/MilitaryManPage/ServicemanPage";
import CompetitionParticipant from "../pages/InfoPages/CompetitionPage/CompetitionParticipant";
import CompetitionResultPage from "../pages/InfoPages/CompetitionPage/CompetitionResultPage";
import CourceEnrollPage from "../pages/InfoPages/CoursePage/CourceEnrollPage";
import CourceSertifikatPage from "../pages/InfoPages/CoursePage/CourceSertifikatPage";
import CategoryNewsPage from "../pages/InfoPages/NewsPage/CategoryNewsPage";
import NewsPage from "../pages/InfoPages/NewsPage/NewsPage";
import NewsStatPage from "../pages/StaticsPage/NewsPage/NewsStatPage";
import NewsDetailPage from "../pages/StaticsPage/NewsPage/NewsDetailPage";
import UserPage from "../pages/InfoPages/UserPage/UserPage";
import CommandStatPage from "../pages/StaticsPage/CommandPage/CommandStatPage";
import ResearchStatPage from "../pages/StaticsPage/TeachingResearchPage/ResearchStatPage";
import BranchPage from "../pages/StaticsPage/TeachingResearchPage/BranchPage";
import ResultPage from "../pages/StaticsPage/TeachingResearchPage/ResultPage";
import TeachStatPage from "../pages/StaticsPage/TeachingResearchPage/TeachStatPage";
import CompetStatPage from "../pages/StaticsPage/CompetitionPage/CompetStatPage";
import CompetParticPage from "../pages/StaticsPage/CompetitionPage/CompetParticPage";
import CompResultStatPage from "../pages/StaticsPage/CompetitionPage/CompResultStatPage";
import CourseStatPage from "../pages/StaticsPage/CourcePage/CourceStatPage";
import CourceEnrolStatPage from "../pages/StaticsPage/CourcePage/CourceEnrolStatPage";
import CourceEnrolSertif from "../pages/StaticsPage/CourcePage/CourceEnrolSertif";
import TechBasePage from "../pages/StaticsPage/TexBasePage/TexBasePage";
import BioShtatPage from "../pages/StaticsPage/BioShtatPage/BioShtatPage";
import StatePage from "../pages/StaticsPage/BioShtatPage/StatePage";
import SafPage from "../pages/StaticsPage/SafPage/SafPage";
import ProtectedRoute from "./ProtectedRoute";
import NotFoundPage from "../pages/NotFoundPage/404Page";


const AppRouter = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<LoginPages />} />

            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute allowed={["superadmin", "admin", "user"]}>
                        <Layout>
                            <Dashboard />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/malumotnoma/birlashma"
                element={
                    <ProtectedRoute allowed={["superadmin"]}>
                        <Layout>
                            <UnitPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/malumotnoma/birlashma/:id/bolinmalar"
                element={
                    <ProtectedRoute allowed={["superadmin"]}>
                        <Layout>
                            <DepartmentDetailPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/malumotnoma/unvonlar"
                element={
                    <ProtectedRoute allowed={["superadmin"]}>
                        <Layout>
                            <RankPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/malumotnoma/lavozimlar"
                element={
                    <ProtectedRoute allowed={["superadmin"]}>
                        <Layout>
                            <PositionPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/malumotnoma/shtat"
                element={
                    <ProtectedRoute allowed={["superadmin"]}>
                        <Layout>
                            <ShtatPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/malumotnoma/oquv/oquv-yillari"
                element={
                    <ProtectedRoute allowed={["superadmin"]}>
                        <Layout>
                            <TeachingYearPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/malumotnoma/oquv/oquv-tadqiqotlar"
                element={
                    <ProtectedRoute allowed={["superadmin", "admin"]}>
                        <Layout>
                            <TeachResearchPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/malumotnoma/oquv/oquv-tadqiqotlar/:id/bolinmalar"
                element={
                    <ProtectedRoute allowed={["superadmin", "admin"]}>
                        <Layout>
                            <TeachingBranchPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/malumotnoma/oquv/oquv-tadqiqotlar/:id/natija"
                element={
                    <ProtectedRoute allowed={["superadmin", "admin"]}>
                        <Layout>
                            <TeachingResultPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/malumotnoma/kurs"
                element={
                    <ProtectedRoute allowed={["superadmin"]}>
                        <Layout>
                            <CoursePage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/malumotnoma/konkurs"
                element={
                    <ProtectedRoute allowed={["superadmin"]}>
                        <Layout>
                            <CompetitionPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/malumotnoma/rahbariy_hujjat"
                element={
                    <ProtectedRoute allowed={["superadmin"]}>
                        <Layout>
                            <CommandPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/malumotnoma/militarymen"
                element={
                    <ProtectedRoute allowed={["superadmin"]}>
                        <Layout>
                            <ServicemanPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/malumotnoma/konkurs/competitions/:id/participants"
                element={
                    <ProtectedRoute allowed={["superadmin"]}>
                        <Layout>
                            <CompetitionParticipant />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/malumotnoma/konkurs/competitions/:id/result"
                element={
                    <ProtectedRoute allowed={["superadmin"]}>
                        <Layout>
                            <CompetitionResultPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/malumotnoma/kurs/:id/oquvchilar"
                element={
                    <ProtectedRoute allowed={["superadmin"]}>
                        <Layout>
                            <CourceEnrollPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/malumotnoma/kurs/enrollment/:id/certificate"
                element={
                    <ProtectedRoute allowed={["superadmin"]}>
                        <Layout>
                            <CourceSertifikatPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/malumotnoma/yangiliklar"
                element={
                    <ProtectedRoute allowed={["superadmin"]}>
                        <Layout>
                            <CategoryNewsPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/malumotnoma/yangiliklar/:categoryId"
                element={
                    <ProtectedRoute allowed={["superadmin"]}>
                        <Layout>
                            <NewsPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/malumotnoma/foydalanuvchi"
                element={
                    <ProtectedRoute allowed={["superadmin"]}>
                        <Layout>
                            <UserPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/yangiliklar"
                element={
                    <ProtectedRoute allowed={["superadmin", "admin", "user"]}>
                        <Layout>
                            <NewsStatPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/yangiliklar/:id"
                element={
                    <ProtectedRoute allowed={["superadmin", "admin", "user"]}>
                        <Layout>
                            <NewsDetailPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/document"
                element={
                    <ProtectedRoute allowed={["superadmin", "admin", "user"]}>
                        <Layout>
                            <CommandStatPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/tadqiqot"
                element={
                    <ProtectedRoute allowed={["superadmin", "admin", "user"]}>
                        <Layout>
                            <ResearchStatPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/oquv-tadqiqotlar/:id/bolinmalar"
                element={
                    <ProtectedRoute allowed={["superadmin", "admin", "user"]}>
                        <Layout>
                            <BranchPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/oquv-tadqiqotlar/:id/natija"
                element={
                    <ProtectedRoute allowed={["superadmin", "admin", "user"]}>
                        <Layout>
                            <ResultPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/oquvlar"
                element={
                    <ProtectedRoute allowed={["superadmin", "admin", "user"]}>
                        <Layout>
                            <TeachStatPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/musobaqalar"
                element={
                    <ProtectedRoute allowed={["superadmin", "admin", "user"]}>
                        <Layout>
                            <CompetStatPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/konkurs/competitions/:id/participants"
                element={
                    <ProtectedRoute allowed={["superadmin", "admin", "user"]}>
                        <Layout>
                            <CompetParticPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/konkurs/competitions/:id/result"
                element={
                    <ProtectedRoute allowed={["superadmin", "admin", "user"]}>
                        <Layout>
                            <CompResultStatPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="kurslar"
                element={
                    <ProtectedRoute allowed={["superadmin", "admin", "user"]}>
                        <Layout>
                            <CourseStatPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/kurs/:id/oquvchilar"
                element={
                    <ProtectedRoute allowed={["superadmin", "admin", "user"]}>
                        <Layout>
                            <CourceEnrolStatPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/kurs/enrollment/:id/certificate"
                element={
                    <ProtectedRoute allowed={["superadmin", "admin", "user"]}>
                        <Layout>
                            <CourceEnrolSertif />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/texnologikbaza"
                element={
                    <ProtectedRoute allowed={["superadmin", "admin", "user"]}>
                        <Layout>
                            <TechBasePage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/bioshtat"
                element={
                    <ProtectedRoute allowed={["superadmin", "admin", "user"]}>
                        <Layout>
                            <BioShtatPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/bioshtat/intizomiy/:id"
                element={
                    <ProtectedRoute allowed={["superadmin", "admin", "user"]}>
                        <Layout>
                            <StatePage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="safqaydnomasi"
                element={
                    <ProtectedRoute allowed={["superadmin", "admin","user"]}>
                        <Layout>
                            <SafPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    </BrowserRouter>
);

export default AppRouter;
