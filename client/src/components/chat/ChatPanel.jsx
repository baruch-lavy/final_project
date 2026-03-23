import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars
import { HiOutlineX } from "react-icons/hi";
import { useMessages, useSendMessage } from "../../hooks/useMessages";
import { useAuthStore } from "../../stores/authStore";
import { useUIStore } from "../../stores/uiStore";
import Button from "../ui/Button";
import styles from "./ChatPanel.module.css";

const CHANNELS = ["general", "operations", "alerts"];

const ChatPanel = () => {
  const chatOpen = useUIStore((s) => s.chatOpen);
  const toggleChat = useUIStore((s) => s.toggleChat);
  const [channel, setChannel] = useState("general");
  const { messages } = useMessages(channel);
  const sendMessage = useSendMessage();
  const user = useAuthStore((s) => s.user);
  const [text, setText] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    if (chatOpen) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage.mutate({ channel, content: text.trim() });
    setText("");
  };

  return (
    <AnimatePresence>
      {chatOpen && (
        <>
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleChat}
          />
          <motion.div
            className={styles.panel}
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Chat &bull; #{channel}</span>
              <button className={styles.closeBtn} onClick={toggleChat}>
                <HiOutlineX />
              </button>
            </div>

            <div className={styles.channels}>
              {CHANNELS.map((ch) => (
                <button
                  key={ch}
                  className={`${styles.channelBtn} ${channel === ch ? styles.channelBtnActive : ""}`}
                  onClick={() => setChannel(ch)}
                >
                  #{ch}
                </button>
              ))}
            </div>

            <div className={styles.messages}>
              {messages?.map((msg) => {
                const isOwn = msg.sender?._id === user?._id;
                return (
                  <div
                    key={msg._id}
                    className={`${styles.msg} ${isOwn ? styles.msgOwn : styles.msgOther}`}
                  >
                    {!isOwn && (
                      <div className={styles.msgSender}>
                        {msg.sender?.username}
                      </div>
                    )}
                    <div>{msg.content}</div>
                    <div className={styles.msgTime}>
                      {new Date(msg.createdAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            <form className={styles.inputArea} onSubmit={handleSend}>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Message #${channel}...`}
                autoFocus
              />
              <Button type="submit" size="sm" disabled={!text.trim()}>
                Send
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatPanel;
