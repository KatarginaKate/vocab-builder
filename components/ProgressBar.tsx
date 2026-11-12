import styles from "../app/dictionary/page.module.css";

export default function ProgressBar({ value }: { value: number }) {
  const progress = Math.min(Math.max(value, 0), 100);
  return (
    <div className={styles.progressCell} aria-label={`Progress ${progress}%`}>
      <span className={styles.progressRing} style={{ background: `conic-gradient(#37d94c ${progress}%, #e5eee9 ${progress}% 100%)` }}><i /></span>
      <small>{progress}%</small>
    </div>
  );
}
