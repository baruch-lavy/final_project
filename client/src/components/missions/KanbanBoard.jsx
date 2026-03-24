import { useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import { useUpdateMissionStatus } from "../../hooks/useMissions";
import Badge from "../ui/Badge";
import styles from "./KanbanBoard.module.css";

const COLUMNS = [
  { id: "Planning", color: "#3b82f6", label: "PLANNING" },
  { id: "Active", color: "#10b981", label: "ACTIVE" },
  { id: "Completed", color: "#6b7280", label: "COMPLETED" },
  { id: "Aborted", color: "#ef4444", label: "ABORTED" },
];

const PRIORITY_COLOR = {
  Critical: "#ef4444",
  High: "#f59e0b",
  Medium: "#3b82f6",
  Low: "#6b7280",
};

const SortableCard = ({ mission, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mission._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={styles.card}
      onClick={() => onClick?.(mission._id)}
    >
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>{mission.title}</span>
        <Badge
          variant={
            mission.priority === "Critical"
              ? "danger"
              : mission.priority === "High"
                ? "warning"
                : "neutral"
          }
        >
          {mission.priority}
        </Badge>
      </div>
      <div className={styles.cardDesc}>
        {mission.description?.slice(0, 80)}
        {mission.description?.length > 80 ? "…" : ""}
      </div>
      <div className={styles.cardFooter}>
        <span
          className={styles.priorityDot}
          style={{ background: PRIORITY_COLOR[mission.priority] }}
        />
        <span className={styles.cardMeta}>
          {mission.assignedTo?.length || 0} assigned
        </span>
        {mission.createdBy?.username && (
          <span className={styles.cardMeta}>
            by {mission.createdBy.username}
          </span>
        )}
      </div>
    </div>
  );
};

const MiniCard = ({ mission }) => (
  <div className={`${styles.card} ${styles.cardDragging}`}>
    <span className={styles.cardTitle}>{mission.title}</span>
  </div>
);

const KanbanBoard = ({ missions, onSelect }) => {
  const [activeId, setActiveId] = useState(null);
  const updateStatus = useUpdateMissionStatus();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const columnData = useMemo(() => {
    const map = {};
    for (const col of COLUMNS) map[col.id] = [];
    for (const m of missions) {
      if (map[m.status]) map[m.status].push(m);
    }
    return map;
  }, [missions]);

  const activeMission = missions.find((m) => m._id === activeId);

  const findColumn = useCallback(
    (id) => {
      if (COLUMNS.some((c) => c.id === id)) return id;
      for (const col of COLUMNS) {
        if (columnData[col.id].some((m) => m._id === id)) return col.id;
      }
      return null;
    },
    [columnData],
  );

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback(
    (event) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const activeCol = findColumn(active.id);
      let overCol = findColumn(over.id);
      // If dropped on a column header itself
      if (COLUMNS.some((c) => c.id === over.id)) overCol = over.id;

      if (activeCol && overCol && activeCol !== overCol) {
        updateStatus.mutate({ id: active.id, status: overCol });
      }
    },
    [findColumn, updateStatus],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.board}>
        {COLUMNS.map((col) => {
          const items = columnData[col.id];
          return (
            <div key={col.id} className={styles.column}>
              <div className={styles.colHeader}>
                <span
                  className={styles.colDot}
                  style={{ background: col.color }}
                />
                <span className={styles.colLabel}>{col.label}</span>
                <span className={styles.colCount}>{items.length}</span>
              </div>
              <SortableContext
                items={items.map((m) => m._id)}
                strategy={verticalListSortingStrategy}
                id={col.id}
              >
                <div className={styles.colBody}>
                  {items.map((m) => (
                    <SortableCard key={m._id} mission={m} onClick={onSelect} />
                  ))}
                  {items.length === 0 && (
                    <div className={styles.colEmpty}>No missions</div>
                  )}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>
      <DragOverlay>
        {activeMission ? <MiniCard mission={activeMission} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
