import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Tournaments.module.scss";
import { FaTrophy, FaMapMarkerAlt, FaCalendarAlt, FaArrowRight } from "react-icons/fa";

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

  const sorted = useMemo(() => {
    // delikatnie sortujemy po starcie (najbliższe u góry)
    return [...items].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }, [items]);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h1>
          Turnieje <span>SPIKEZONE</span>
        </h1>
        <p className={styles.sub}>Kliknij turniej, aby zobaczyć szczegóły i informacje organizacyjne.</p>
      </div>

      <div className={styles.container}>
        {loading && <div className={styles.msg}>Ładowanie...</div>}
        {err && <div className={`${styles.msg} ${styles.err}`}>❌ {err}</div>}

        {!loading && !err && sorted.length === 0 && (
          <div className={styles.msg}>Brak opublikowanych turniejów.</div>
        )}

        <div className={styles.grid}>
          {sorted.map((t) => (
            <button
              key={t._id}
              className={styles.card}
              onClick={() => navigate(`/tournaments/${t.slug}`)}
              type="button"
            >
              <div className={styles.top}>
                <div className={styles.icon}>
                  <FaTrophy />
                </div>

                <div className={styles.badge}>
                  <FaCalendarAlt />{" "}
                  {new Date(t.startDate).toLocaleDateString("pl-PL")} –{" "}
                  {new Date(t.endDate).toLocaleDateString("pl-PL")}
                </div>
              </div>

              <div className={styles.title}>{t.title}</div>

              <div className={styles.meta}>
                <span className={styles.metaItem}>
                  <FaMapMarkerAlt />
                  {t.city || "—"}
                </span>

                {!!t.venue && <span className={styles.metaSep}>•</span>}

                {!!t.venue && <span className={styles.venue}>{t.venue}</span>}
              </div>

              <div className={styles.footer}>
                <span className={styles.pill}>Limit: {t.teamLimit ?? 16}</span>
                <span className={styles.pill}>Wpisowe: {t.entryFee ?? 0} zł</span>

                <span className={styles.open}>
                  Zobacz <FaArrowRight />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
