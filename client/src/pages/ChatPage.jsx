import { useState, useRef, useEffect, Suspense } from "react";
import { HiOutlineHashtag } from "react-icons/hi";
import { useMessages, useSendMessage } from "../hooks/useMessages";
import { useAuthStore } from "../stores/authStore";
import Button from "../components/ui/Button";
import { Spinner } from "../components/ui/Loader";
import styles from "./ChatPage.module.css";

const CHANNELS = ["general", "operations", "alerts", "intel"];

const MessageBubble = ({ msg, isOwn }) => {
  const cls =
    msg.type === "system" || msg.type === "alert"
      ? styles.messageSystem
      : isOwn
        ? styles.messageOwn
        : styles.messageOther;

  return (
    <div className={`${styles.message} ${cls}`}>
      {!isOwn && msg.type !== "system" && (
        <div className={styles.messageSender}>
          {msg.sender?.username || "Unknown"}
        </div>
      )}
      <div>{msg.content}</div>
      <div className={styles.messageTime}>
        {new Date(msg.createdAt).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>
  );
};

const ChatMessages = ({ channel }) => {
  const { messages, loading } = useMessages(channel);
  const sendMessage = useSendMessage();
  const user = useAuthStore((s) => s.user);
  const messagesEndRef = useRef(null);
  const [text, setText] = useState("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage.mutate({ channel, content: text.trim() });
    setText("");
  };

  if (loading) return <Spinner />;

  return (
    <div className={styles.chatArea}>
      <div className={styles.messages}>
        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            msg={msg}
            isOwn={msg.sender?._id === user?._id}
          />
        ))}
        <div ref={messagesEndRef} />
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
    </div>
  );
};

const ChatPage = () => {
  const [channel, setChannel] = useState("general");

  return (
    <div className={styles.container}>
      <div className={styles.channels}>
        <div className={styles.channelsHeader}>Channels</div>
        <div className={styles.channelList}>
          {CHANNELS.map((ch) => (
            <button
              key={ch}
              className={`${styles.channelBtn} ${channel === ch ? styles.channelBtnActive : ""}`}
              onClick={() => setChannel(ch)}
            >
              <HiOutlineHashtag /> {ch}
            </button>
          ))}
        </div>
      </div>
      <Suspense fallback={<Spinner />}>
        <ChatMessages channel={channel} />
      </Suspense>
    </div>
  );
};

export default ChatPage;
