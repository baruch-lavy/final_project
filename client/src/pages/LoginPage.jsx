import { useState, useActionState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { useAuthStore } from "../stores/authStore";
import { Input, Select } from "../components/ui/Input";
import Button from "../components/ui/Button";
import styles from "./LoginPage.module.css";

const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

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
      {/* Animated grid background */}
      <div className={styles.bgGrid} />

      {/* Radar rings */}
      <div className={styles.radarWrap}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.radarRing} style={{ animationDelay: `${i * 0.6}s` }} />
        ))}
        <div className={styles.radarBeam} />
        <div className={styles.radarCenter} />
      </div>

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className={styles.particle}
          style={{
            left: `${10 + (i * 7.3) % 80}%`,
            top: `${5 + (i * 13.7) % 90}%`,
            animationDelay: `${(i * 0.7) % 4}s`,
            animationDuration: `${3 + (i * 0.5) % 4}s`,
          }}
        />
      ))}

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className={styles.logoSection}>
          <motion.div
            className={styles.logoIcon}
            animate={{ boxShadow: ["0 0 20px rgba(59,130,246,0.4)", "0 0 40px rgba(59,130,246,0.8)", "0 0 20px rgba(59,130,246,0.4)"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            A
          </motion.div>
          <div className={styles.logoText}>AEGIS</div>
          <div className={styles.logoSub}>Tactical Operations Center</div>
        </div>

        <div className={styles.securityBadge}>
          <span className={styles.securityDot} />
          CLASSIFIED — AUTHORIZED ACCESS ONLY
        </div>

        <form action={submitAction} className={styles.form}>
          {error && (
            <motion.div
              className={styles.error}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              ⚠ {error}
            </motion.div>
          )}

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
                ? "Register Operator"
                : "Authenticate"}
          </Button>

          <div className={styles.switchText}>
            {isRegister ? "Already have access?" : "Need clearance?"}{" "}
            <button
              type="button"
              className={styles.switchLink}
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? "Sign In" : "Request Access"}
            </button>
          </div>
        </form>

        <div className={styles.demoAccounts}>
          <div className={styles.demoTitle}>Demo Accounts</div>
          <div className={styles.demoList}>
            <span>hawk@aegis.mil</span>
            <span>viper@aegis.mil</span>
            <span className={styles.demoPwd}>password123</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
