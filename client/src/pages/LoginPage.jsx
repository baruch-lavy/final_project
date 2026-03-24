import { useState, useEffect, useActionState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../stores/authStore";
import { Input, Select } from "../components/ui/Input";
import Button from "../components/ui/Button";
import styles from "./LoginPage.module.css";

/* Boot-up text sequence */
const BOOT_LINES = [
  "AEGIS TACTICAL OS v4.7.2",
  "Initializing secure connection...",
  "Loading encryption modules... OK",
  "Satellite uplink established",
  "Verifying clearance protocols...",
  "SYSTEM READY — AWAITING AUTHENTICATION",
];

const BootSequence = ({ onComplete }) => {
  const [lines, setLines] = useState([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      if (i < BOOT_LINES.length) {
        setLines((prev) => [...prev, BOOT_LINES[i]]);
        i++;
      } else {
        clearInterval(id);
        setTimeout(() => {
          setDone(true);
          onComplete();
        }, 400);
      }
    }, 250);
    return () => clearInterval(id);
  }, [onComplete]);

  return (
    <motion.div
      className={styles.bootScreen}
      animate={done ? { opacity: 0, scale: 1.05 } : { opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.bootTerminal}>
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className={
              i === lines.length - 1 ? styles.bootLineLast : styles.bootLine
            }
          >
            <span className={styles.bootPrefix}>&gt;</span> {line}
          </motion.div>
        ))}
        <span className={styles.bootCursor} />
      </div>
    </motion.div>
  );
};

const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [booting, setBooting] = useState(true);
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

      {/* Horizontal scan lines */}
      <div className={styles.scanLines} />

      {/* Vignette overlay */}
      <div className={styles.vignette} />

      {/* Radar rings */}
      <div className={styles.radarWrap}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={styles.radarRing}
            style={{ animationDelay: `${i * 0.6}s` }}
          />
        ))}
        <div className={styles.radarBeam} />
        <div className={styles.radarCenter} />
      </div>

      {/* Secondary radar top-right */}
      <div className={styles.radarWrapAlt}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={styles.radarRing}
            style={{ animationDelay: `${i * 0.8}s` }}
          />
        ))}
        <div className={styles.radarBeam} />
      </div>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className={styles.particle}
          style={{
            left: `${5 + ((i * 4.8) % 90)}%`,
            top: `${5 + ((i * 11.3) % 90)}%`,
            animationDelay: `${(i * 0.5) % 5}s`,
            animationDuration: `${3 + ((i * 0.4) % 4)}s`,
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
          }}
        />
      ))}

      {/* Connecting lines between particles */}
      <svg className={styles.connectionLines}>
        {[...Array(6)].map((_, i) => (
          <line
            key={i}
            x1={`${10 + i * 15}%`}
            y1={`${20 + ((i * 12) % 60)}%`}
            x2={`${20 + i * 14}%`}
            y2={`${30 + ((i * 18) % 50)}%`}
            stroke="rgba(6,182,212,0.08)"
            strokeWidth="1"
          />
        ))}
      </svg>

      {/* Boot sequence overlay */}
      <AnimatePresence>
        {booting && <BootSequence onComplete={() => setBooting(false)} />}
      </AnimatePresence>

      {/* Main card */}
      {!booting && (
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 40, scale: 0.9, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* HUD corner brackets */}
          <div className={styles.hudCornerTL} />
          <div className={styles.hudCornerTR} />
          <div className={styles.hudCornerBL} />
          <div className={styles.hudCornerBR} />

          {/* Animated top glow line */}
          <div className={styles.glowLine} />

          <div className={styles.logoSection}>
            <motion.div
              className={styles.logoIcon}
              animate={{
                boxShadow: [
                  "0 0 20px rgba(6,182,212,0.3), 0 0 60px rgba(6,182,212,0.1)",
                  "0 0 40px rgba(6,182,212,0.6), 0 0 80px rgba(6,182,212,0.2)",
                  "0 0 20px rgba(6,182,212,0.3), 0 0 60px rgba(6,182,212,0.1)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="12,2 22,20 2,20" />
                <line x1="12" y1="8" x2="12" y2="14" />
                <circle cx="12" cy="17" r="0.5" fill="currentColor" />
              </svg>
            </motion.div>
            <motion.div
              className={styles.logoText}
              initial={{ letterSpacing: "20px", opacity: 0 }}
              animate={{ letterSpacing: "10px", opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              AEGIS
            </motion.div>
            <motion.div
              className={styles.logoSub}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Tactical Operations Command Center
            </motion.div>
          </div>

          <motion.div
            className={styles.securityBadge}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <span className={styles.securityDot} />
            CLASSIFIED — AUTHORIZED ACCESS ONLY
          </motion.div>

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

            <AnimatePresence>
              {isRegister && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: "hidden" }}
                >
                  <Input
                    name="username"
                    label="Callsign"
                    placeholder="Enter your callsign"
                    required
                    minLength={3}
                  />
                  <div style={{ height: 18 }} />
                  <Select name="role" label="Clearance Level">
                    <option value="Operator">Operator</option>
                    <option value="Commander">Commander</option>
                    <option value="Analyst">Analyst</option>
                  </Select>
                  <div style={{ height: 18 }} />
                </motion.div>
              )}
            </AnimatePresence>

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
                ? "AUTHENTICATING..."
                : isRegister
                  ? "REQUEST ACCESS"
                  : "AUTHENTICATE"}
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
            <div className={styles.demoTitle}>DEMO CREDENTIALS</div>
            <div className={styles.demoGrid}>
              <div className={styles.demoAccount}>
                <span className={styles.demoRole}>CMD</span>
                <span className={styles.demoEmail}>hawk@aegis.mil</span>
              </div>
              <div className={styles.demoAccount}>
                <span className={styles.demoRole}>OPR</span>
                <span className={styles.demoEmail}>viper@aegis.mil</span>
              </div>
              <div className={styles.demoAccount}>
                <span className={styles.demoRole}>ANL</span>
                <span className={styles.demoEmail}>eagle@aegis.mil</span>
              </div>
            </div>
            <div className={styles.demoPwd}>Password: password123</div>
          </div>
        </motion.div>
      )}

      {/* Bottom status bar */}
      {!booting && (
        <motion.div
          className={styles.statusBar}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <span>ENCRYPTION: AES-256</span>
          <span className={styles.statusSep}>|</span>
          <span>PROTOCOL: TLS 1.3</span>
          <span className={styles.statusSep}>|</span>
          <span>
            UPLINK: <span className={styles.statusActive}>ACTIVE</span>
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default LoginPage;
