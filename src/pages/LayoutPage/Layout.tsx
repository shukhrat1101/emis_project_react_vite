import Sidebar from "./Sidebar";
import Header from "./Header";
import "./Layout.scss"

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="layout-wrapper">
      <Sidebar />
      <div className="layout-main">
        <Header />
        <main className="layout-content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
