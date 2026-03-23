import { useState, useActionState, useOptimistic, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars
import { HiOutlinePlus, HiOutlineUsers, HiOutlineClock } from "react-icons/hi";
import {
  useMissions,
  useCreateMission,
  useUpdateMissionStatus,
  useDeleteMission,
  useAddMissionUpdate,
} from "../hooks/useMissions";
import { useAuthStore } from "../stores/authStore";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { Input, Select, Textarea } from "../components/ui/Input";
import { Spinner } from "../components/ui/Loader";
import styles from "./MissionsPage.module.css";

const STATUSES = ["All", "Active", "Planning", "Completed", "Aborted"];

const MissionCard = ({ mission, onClick }) => (
  <motion.div
    className={styles.card}
    onClick={onClick}
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    layout
  >
    <div className={styles.cardHeader}>
      <span className={styles.cardTitle}>{mission.title}</span>
      <Badge variant={mission.priority}>{mission.priority}</Badge>
    </div>
    <div className={styles.cardDesc}>{mission.description}</div>
    <div className={styles.cardMeta}>
      <Badge variant={mission.status}>{mission.status}</Badge>
      <span className={styles.cardMetaItem}>
        <HiOutlineUsers /> {mission.assignedTo?.length || 0}
      </span>
      <span className={styles.cardMetaItem}>
        <HiOutlineClock /> {new Date(mission.createdAt).toLocaleDateString()}
      </span>
    </div>
  </motion.div>
);

const CreateMissionModal = ({ isOpen, onClose }) => {
  const createMission = useCreateMission();

  const [error, submitAction, isPending] = useActionState(
    async (_prev, formData) => {
      try {
        await createMission.mutateAsync({
          title: formData.get("title"),
          description: formData.get("description"),
          priority: formData.get("priority"),
          status: "Planning",
          location: {
            type: "Point",
            coordinates: [
              parseFloat(formData.get("lng")) || 34.78,
              parseFloat(formData.get("lat")) || 32.08,
            ],
          },
        });
        onClose();
        return null;
      } catch (err) {
        return err.response?.data?.message || "Failed to create mission";
      }
    },
    null,
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Mission">
      <form action={submitAction} className={styles.formGrid}>
        {error && (
          <div style={{ color: "var(--accent-red)", fontSize: 13 }}>
            {error}
          </div>
        )}
        <Input
          name="title"
          label="Mission Title"
          placeholder="Operation codename..."
          required
        />
        <Textarea
          name="description"
          label="Description"
          placeholder="Mission objectives..."
          required
        />
        <div className={styles.formRow}>
          <Select name="priority" label="Priority">
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
            <option value="Low">Low</option>
          </Select>
        </div>
        <div className={styles.formRow}>
          <Input
            name="lat"
            label="Latitude"
            type="number"
            step="any"
            defaultValue="32.08"
          />
          <Input
            name="lng"
            label="Longitude"
            type="number"
            step="any"
            defaultValue="34.78"
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Mission"}
        </Button>
      </form>
    </Modal>
  );
};

const MissionDetail = ({ mission, onClose }) => {
  const updateStatus = useUpdateMissionStatus();
  const deleteMission = useDeleteMission();
  const addUpdate = useAddMissionUpdate();
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === "Commander" || user?.role === "Operator";

  // React 19 useOptimistic for instant status feedback
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    mission.status,
    (_current, newStatus) => newStatus,
  );

  const handleStatus = async (status) => {
    setOptimisticStatus(status);
    await updateStatus.mutateAsync({ id: mission._id, status });
  };

  const [updateError, submitUpdate, isUpdating] = useActionState(
    async (_prev, formData) => {
      const message = formData.get("message");
      if (!message?.trim()) return "Message is required";
      try {
        await addUpdate.mutateAsync({ id: mission._id, message });
        return null;
      } catch {
        return "Failed to add update";
      }
    },
    null,
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={mission.title}
      footer={
        canEdit && (
          <Button
            variant="danger"
            size="sm"
            onClick={async () => {
              await deleteMission.mutateAsync(mission._id);
              onClose();
            }}
          >
            Delete Mission
          </Button>
        )
      }
    >
      <div className={styles.detailSection}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <Badge variant={optimisticStatus}>{optimisticStatus}</Badge>
          <Badge variant={mission.priority}>{mission.priority}</Badge>
        </div>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          {mission.description}
        </p>
      </div>

      {canEdit && (
        <div className={styles.detailSection}>
          <div className={styles.detailLabel}>Change Status</div>
          <div className={styles.statusActions}>
            {["Planning", "Active", "Completed", "Aborted"]
              .filter((s) => s !== optimisticStatus)
              .map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant="secondary"
                  onClick={() => handleStatus(s)}
                >
                  → {s}
                </Button>
              ))}
          </div>
        </div>
      )}

      {mission.assignedTo?.length > 0 && (
        <div className={styles.detailSection}>
          <div className={styles.detailLabel}>Assigned Personnel</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {mission.assignedTo.map((u) => (
              <Badge key={u._id} variant={u.role}>
                {u.username}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {mission.updates?.length > 0 && (
        <div className={styles.detailSection}>
          <div className={styles.detailLabel}>Mission Timeline</div>
          <div className={styles.timeline}>
            {mission.updates.map((upd, i) => (
              <div key={i} className={styles.timelineItem}>
                <div className={styles.timelineMsg}>{upd.message}</div>
                <div className={styles.timelineInfo}>
                  {upd.author?.username || "System"} &bull;{" "}
                  {new Date(upd.timestamp).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.detailSection}>
        <div className={styles.detailLabel}>Add Update</div>
        <form action={submitUpdate} className={styles.formGrid}>
          {updateError && (
            <div style={{ color: "var(--accent-red)", fontSize: 12 }}>
              {updateError}
            </div>
          )}
          <Textarea
            name="message"
            placeholder="Enter mission update..."
            rows={2}
            required
          />
          <Button type="submit" size="sm" disabled={isUpdating}>
            {isUpdating ? "Posting..." : "Post Update"}
          </Button>
        </form>
      </div>
    </Modal>
  );
};

const MissionsContent = () => {
  const { missions, loading } = useMissions();
  const [filter, setFilter] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const user = useAuthStore((s) => s.user);
  const canCreate = user?.role === "Commander" || user?.role === "Operator";

  const filtered =
    filter === "All" ? missions : missions.filter((m) => m.status === filter);
  const selected = missions.find((m) => m._id === selectedId);

  if (loading) return <Spinner />;

  return (
    <>
      <div className={styles.header}>
        <span className={styles.title}>
          {filtered.length} mission{filtered.length !== 1 ? "s" : ""}
        </span>
        {canCreate && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <HiOutlinePlus /> New Mission
          </Button>
        )}
      </div>

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

      <CreateMissionModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      {selected && (
        <MissionDetail mission={selected} onClose={() => setSelectedId(null)} />
      )}
    </>
  );
};

const MissionsPage = () => (
  <Suspense fallback={<Spinner />}>
    <MissionsContent />
  </Suspense>
);

export default MissionsPage;
