import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../api/api";
import styles from "./HomeStatsStrip.module.scss";
import { FaTrophy, FaUsers, FaCheckCircle, FaClock } from "react-icons/fa";

export default function HomeStatsStrip() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await apiFetch("/api/public/stats");
        setStats(data || null);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const items = useMemo(
    () => [
      {
        icon: <FaTrophy />,
        label: "Turnieje",
        value: stats?.tournamentsTotal ?? "—",
        sub: "Wszystkie opublikowane",
      },
      {
        icon: <FaClock />,
        label: "Nadchodzące",
        value: stats?.tournamentsUpcoming ?? "—",
        sub: "Start w przyszłości",
      },
      {
        icon: <FaUsers />,
        label: "Drużyny",
        value: stats?.teamsTotal ?? "—",
        sub: "W bazie systemu",
      },
      {
        icon: <FaCheckCircle />,
        label: "Zaakceptowane",
        value: stats?.teamsApproved ?? "—",
        sub: "Zatwierdzone przez Organizatora",
      },
    ],
    [stats]
  );

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.head}>
          <div>
            <h3 className={styles.title}>
              Statystyki <span>SPIKEZONE</span>
            </h3>
            <p className={styles.sub}>
              Najważniejsze liczby w jednym miejscu — aktualizują się automatycznie.
            </p>
          </div>
        </div>

        <div className={styles.strip}>
          {items.map((it) => (
            <div
              key={it.label}
              className={`${styles.item} ${loading ? styles.isLoading : ""}`}
            >
              <div className={styles.icon}>{it.icon}</div>

              <div className={styles.meta}>
                <div className={styles.topRow}>
                  <div className={styles.value}>
                    {loading ? <span className={styles.skelText} /> : it.value}
                  </div>
                  <div className={styles.label}>{it.label}</div>
                </div>

                <div className={styles.subLabel}>
                  {loading ? <span className={styles.skelLine} /> : it.sub}
                </div>

                <div className={styles.bar}>
                  <span className={styles.barFill} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && !stats && (
          <div className={styles.hint}>
            (Opcjonalnie) Dodaj endpoint <span>/api/public/stats</span> żeby liczby były dynamiczne.
          </div>
        )}
      </div>
    </section>
  );
}
