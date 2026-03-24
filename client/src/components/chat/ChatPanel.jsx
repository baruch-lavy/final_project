import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineX } from "react-icons/hi";
import {
  useMessages,
  useSendMessage,
  useTypingIndicator,
  useReactToMessage,
} from "../../hooks/useMessages";
import { useAuthStore } from "../../stores/authStore";
import { useUIStore } from "../../stores/uiStore";
import Button from "../ui/Button";
import styles from "./ChatPanel.module.css";

const CHANNELS = ["general", "operations", "alerts"];
const QUICK_REACTIONS = ["\u{1F44D}", "\u{2764}\u{FE0F}", "\u{1F680}", "\u{2705}", "\u{26A0}\u{FE0F}"];

const ReactionBar = ({ reactions = [], onReact, userId }) => {
  const grouped = {};
  for (const r of reactions) {
    if (!grouped[r.emoji]) grouped[r.emoji] = [];
    grouped[r.emoji].push(r.user);
  }

  return (
    <div className={styles.reactions}>
      {Object.entries(grouped).map(([emoji, users]) => (
        <button
          key={emoji}
          className={`${styles.reactionChip} ${users.includes(userId) ? styles.reactionChipOwn : ""}`}
          onClick={() => onReact(emoji)}
        >
          {emoji} {users.length}
        </button>
      ))}
    </div>
  );
};

const TypingIndicator = ({ users }) => {
  if (users.length === 0) return null;
  const names = users.map((u) => u.username);
  const text =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length <= 3
        ? `${names.join(", ")} are typing`
        : "Several people are typing";

  return (
    <motion.div
      className={styles.typingBar}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
    >
      <span className={styles.typingDots}>
        <span /><span /><span />
      </span>
      {text}
    </motion.div>
  );
};

const ChatPanel = () => {
  const chatOpen = useUIStore((s) => s.chatOpen);
  const toggleChat = useUIStore((s) => s.toggleChat);
  const [channel, setChannel] = useState("general");
  const { messages } = useMessages(channel);
  const sendMessage = useSendMessage();
  const { typingUsers, emitTyping } = useTypingIndicator(channel);
  const reactToMessage = useReactToMessage();
  const user = useAuthStore((s) => s.user);
  const [text, setText] = useState("");
  const [reactionMsgId, setReactionMsgId] = useState(null);
  const endRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    if (chatOpen) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatOpen]);

  const handleTextChange = useCallback(
    (e) => {
      setText(e.target.value);
      emitTyping(true);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => emitTyping(false), 2000);
    },
    [emitTyping],
  );

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage.mutate({ channel, content: text.trim() });
    setText("");
    emitTyping(false);
    clearTimeout(typingTimeout.current);
  };

  const handleReact = useCallback(
    (msgId, emoji) => {
      reactToMessage(msgId, emoji);
      setReactionMsgId(null);
    },
    [reactToMessage],
  );

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
                    onDoubleClick={() =>
                      setReactionMsgId(reactionMsgId === msg._id ? null : msg._id)
                    }
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

                    {msg.reactions?.length > 0 && (
                      <ReactionBar
                        reactions={msg.reactions}
                        onReact={(emoji) => handleReact(msg._id, emoji)}
                        userId={user?._id}
                      />
                    )}

                    <AnimatePresence>
                      {reactionMsgId === msg._id && (
                        <motion.div
                          className={styles.reactionPicker}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          {QUICK_REACTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              className={styles.reactionPickerBtn}
                              onClick={() => handleReact(msg._id, emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            <AnimatePresence>
              <TypingIndicator users={typingUsers} />
            </AnimatePresence>

            <form className={styles.inputArea} onSubmit={handleSend}>
              <input
                value={text}
                onChange={handleTextChange}
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
