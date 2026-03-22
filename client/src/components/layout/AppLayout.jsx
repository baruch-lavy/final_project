import { Outlet, useLocation } from "react-router";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import ChatPanel from "../chat/ChatPanel";
import styles from "./AppLayout.module.css";

const fullscreenRoutes = ["/map"];

const AppLayout = () => {
  const { pathname } = useLocation();
  const isFullscreen = fullscreenRoutes.includes(pathname);

  return (
    <div className={styles.layout}>
      <Sidebar />
      <TopBar />
      <main className={isFullscreen ? styles.mainFullscreen : styles.main}>
        <Outlet />
      </main>
      <ChatPanel />
    </div>
  );
};

export default AppLayout;
