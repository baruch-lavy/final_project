import { useActionState, useOptimistic } from "react";
import {
  useUpdateMissionStatus,
  useDeleteMission,
  useAddMissionUpdate,
} from "../../hooks/useMissions";
import { usePermissions } from "../../hooks/usePermissions";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import { Textarea } from "../ui/Input";
import styles from "./MissionDetail.module.css";

const MissionDetail = ({ mission, onClose }) => {
  const updateStatus = useUpdateMissionStatus();
  const deleteMission = useDeleteMission();
  const addUpdate = useAddMissionUpdate();
  const { canEditMission, canDeleteMission } = usePermissions();

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
        canDeleteMission && (
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

      {canEditMission && (
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

export default MissionDetail;
