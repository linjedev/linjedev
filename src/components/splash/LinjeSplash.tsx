import Image from "next/image";
import styles from "./LinjeSplash.module.css";

export function LinjeSplash() {
  return (
    <main className={styles.shell} aria-label="Linje">
      <div className={styles.grid} />
      <div className={styles.markWrap} aria-hidden="true">
        <div className={styles.orbitOuter} />
        <div className={styles.orbitMiddle} />
        <div className={styles.orbitInner} />
        <span className={styles.mark}>
          <Image src="/logo/logo-icon.svg" alt="" width={84} height={84} priority />
        </span>
      </div>
    </main>
  );
}
