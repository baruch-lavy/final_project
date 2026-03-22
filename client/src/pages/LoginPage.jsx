import { useState, useActionState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../stores/authStore";
import { Input, Select } from "../components/ui/Input";
import Button from "../components/ui/Button";
import styles from "./LoginPage.module.css";

const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  // React 19 useActionState for form handling
  const [error, submitAction, isPending] = useActionState(
    async (_prevState, formData) => {
      const email = formData.get("email");
      const password = formData.get("password");

      try {
        if (isRegister) {
          const username = formData.get("username");
          const role = formData.get("role");
          await register(username, email, password, role);
        } else {
          await login(email, password);
        }
        navigate("/");
        return null;
      } catch (err) {
        return err.response?.data?.message || "Something went wrong";
      }
    },
    null,
  );

  return (
    <div className={styles.page}>
      <div className={styles.bgGrid} />
      <div className={styles.card}>
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>A</div>
          <div className={styles.logoText}>AEGIS</div>
          <div className={styles.logoSub}>Tactical Operations Center</div>
        </div>

        <form action={submitAction} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          {isRegister && (
            <>
              <Input
                name="username"
                label="Callsign"
                placeholder="Enter your callsign"
                required
                minLength={3}
              />
              <Select name="role" label="Role">
                <option value="Operator">Operator</option>
                <option value="Commander">Commander</option>
                <option value="Analyst">Analyst</option>
              </Select>
            </>
          )}

          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="operator@aegis.mil"
            required
          />
          <Input
            name="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            required
            minLength={6}
          />

          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Authenticating..."
              : isRegister
                ? "Register"
                : "Sign In"}
          </Button>

          <div className={styles.switchText}>
            {isRegister ? "Already have access?" : "Need an account?"}{" "}
            <button
              type="button"
              className={styles.switchLink}
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? "Sign In" : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
