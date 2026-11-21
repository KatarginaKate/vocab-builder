import styles from "../../app/dictionary/page.module.css";

export default function ProgressBar({ value, variant = "default" }: { value: number; variant?: "default" | "training" }) {
  const progress = Math.min(Math.max(value, 0), 100);
  return (
    <div className={`${styles.progressCell} ${variant === "training" ? styles.trainingProgress : ""}`} role="progressbar" aria-label={variant === "training" ? "Training progress" : `Progress ${progress}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
      <span className={styles.progressRing} style={{ background: `conic-gradient(var(--progress-active, #37d94c) ${progress}%, var(--progress-track, #e5eee9) ${progress}% 100%)` }}><i /></span>
      {progress > 0 && <small>{progress}%</small>}
    </div>
  );
}
