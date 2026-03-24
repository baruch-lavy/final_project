import { Outlet, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import OpsTicker from "./OpsTicker";
import CommandPalette from "./CommandPalette";
import ChatPanel from "../chat/ChatPanel";
import styles from "./AppLayout.module.css";

const fullscreenRoutes = ["/map"];

const pageVariants = {
  initial: { opacity: 0, y: 12, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(4px)" },
};

const AppLayout = () => {
  const { pathname } = useLocation();
  const isFullscreen = fullscreenRoutes.includes(pathname);

  return (
    <div className={styles.layout}>
      <Sidebar />
      <TopBar />
      <main className={isFullscreen ? styles.mainFullscreen : styles.main}>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{ height: "100%" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>{" "}
      </main>{" "}
      <ChatPanel />
      <OpsTicker />
      <CommandPalette />
    </div>
  );
};

export default AppLayout;
