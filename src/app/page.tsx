import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.shell}>
      <div className={styles.grid} />
      <section className={styles.panel} aria-labelledby="splash-title">
        <div className={styles.markWrap} aria-hidden="true">
          <div className={styles.orbitOuter} />
          <div className={styles.orbitMiddle} />
          <div className={styles.orbitInner} />
          <span className={styles.mark}>
            <Image src="/logo/logo-icon.svg" alt="" width={28} height={28} priority />
          </span>
        </div>

        <p className={styles.eyebrow}>Linje</p>
        <h1 id="splash-title" className={styles.title}>
          New signal coming soon.
        </h1>
        <p className={styles.copy}>
          Linje is offline while the next public experience is prepared.
        </p>
      </section>
    </main>
  );
}
