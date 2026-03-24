import styles from "./Card.module.css";

const Card = ({ children, className = "", ...props }) => (
  <div className={`${styles.card} ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
