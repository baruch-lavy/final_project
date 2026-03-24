import { useActionState } from "react";
import { useCreateMission } from "../../hooks/useMissions";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Input, Select, Textarea } from "../ui/Input";
import styles from "./MissionForm.module.css";

const MissionForm = ({ isOpen, onClose }) => {
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

export default MissionForm;
