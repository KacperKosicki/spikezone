import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Tournaments.module.scss";

const API = "http://localhost:5000";

export default function Tournaments() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const res = await fetch(`${API}/api/tournaments`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Nie udało się pobrać turniejów");
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <h1>Turnieje</h1>
        <p className={styles.sub}>Kliknij turniej, aby zobaczyć szczegóły.</p>

        {loading && <div className={styles.msg}>Ładowanie...</div>}
        {err && <div className={`${styles.msg} ${styles.err}`}>❌ {err}</div>}

        {!loading && !err && items.length === 0 && (
          <div className={styles.msg}>Brak opublikowanych turniejów.</div>
        )}

        <div className={styles.grid}>
          {items.map((t) => (
            <button
              key={t._id}
              className={styles.card}
              onClick={() => navigate(`/tournaments/${t.slug}`)}
            >
              <div className={styles.title}>{t.title}</div>

              <div className={styles.meta}>
                <span>{t.city || "—"}</span>
                <span>•</span>
                <span>
                  {new Date(t.startDate).toLocaleDateString("pl-PL")} –{" "}
                  {new Date(t.endDate).toLocaleDateString("pl-PL")}
                </span>
              </div>

              {!!t.venue && <div className={styles.venue}>{t.venue}</div>}

              <div className={styles.footer}>
                <span className={styles.badge}>
                  Limit: {t.teamLimit ?? 16}
                </span>
                <span className={styles.badge}>
                  Wpisowe: {t.entryFee ?? 0} zł
                </span>
                <span className={styles.open}>Zobacz →</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
