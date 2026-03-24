import { useState, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { HiOutlinePlus, HiOutlineViewBoards, HiOutlineViewGrid } from "react-icons/hi";
import { useMissions } from "../hooks/useMissions";
import { useAuthStore } from "../stores/authStore";
import Button from "../components/ui/Button";
import { SkeletonCard } from "../components/ui/Skeleton";
import MissionCard from "../components/missions/MissionCard";
import MissionDetail from "../components/missions/MissionDetail";
import MissionForm from "../components/missions/MissionForm";
import KanbanBoard from "../components/missions/KanbanBoard";
import styles from "./MissionsPage.module.css";

const STATUSES = ["All", "Active", "Planning", "Completed", "Aborted"];

const MissionsContent = () => {
  const { missions, loading } = useMissions();
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState("grid");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const user = useAuthStore((s) => s.user);
  const canCreate = user?.role === "Commander" || user?.role === "Operator";

  const filtered =
    filter === "All" ? missions : missions.filter((m) => m.status === filter);
  const selected = missions.find((m) => m._id === selectedId);

  if (loading)
    return (
      <div className={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );

  return (
    <>
      <div className={styles.header}>
        <span className={styles.title}>
          {filtered.length} mission{filtered.length !== 1 ? "s" : ""}
        </span>
        <div className={styles.headerActions}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${view === "grid" ? styles.viewBtnActive : ""}`}
              onClick={() => setView("grid")}
              title="Grid view"
            >
              <HiOutlineViewGrid />
            </button>
            <button
              className={`${styles.viewBtn} ${view === "kanban" ? styles.viewBtnActive : ""}`}
              onClick={() => setView("kanban")}
              title="Kanban board"
            >
              <HiOutlineViewBoards />
            </button>
          </div>
          {canCreate && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <HiOutlinePlus /> New Mission
            </Button>
          )}
        </div>
      </div>

      {view === "grid" && (
        <>
          <div className={styles.filters}>
            {STATUSES.map((s) => (
              <button
                key={s}
                className={`${styles.filterBtn} ${filter === s ? styles.filterBtnActive : ""}`}
                onClick={() => setFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div className={styles.grid}>
            <AnimatePresence mode="popLayout">
              {filtered.map((mission) => (
                <MissionCard
                  key={mission._id}
                  mission={mission}
                  onClick={() => setSelectedId(mission._id)}
                />
              ))}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: "var(--text-muted)",
                padding: 40,
                fontSize: 14,
              }}
            >
              No missions found
            </div>
          )}
        </>
      )}

      {view === "kanban" && (
        <KanbanBoard
          missions={missions}
          onSelect={(id) => setSelectedId(id)}
        />
      )}

      <MissionForm isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      {selected && (
        <MissionDetail mission={selected} onClose={() => setSelectedId(null)} />
      )}
    </>
  );
};

const MissionsPage = () => (
  <Suspense fallback={<SkeletonCard />}>
    <MissionsContent />
  </Suspense>
);

export default MissionsPage;
