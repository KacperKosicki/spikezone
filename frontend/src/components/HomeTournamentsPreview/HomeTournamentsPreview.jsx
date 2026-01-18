import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api/api";
import styles from "./HomeTournamentsPreview.module.scss";
import { FaTrophy, FaCalendarAlt, FaArrowRight, FaClock } from "react-icons/fa";

export default function HomeTournamentsPreview({ limit = 3 }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("Ładowanie...");

  useEffect(() => {
    (async () => {
      try {
        setMsg("Ładowanie...");
        const data = await apiFetch("/api/tournaments");
        const arr = Array.isArray(data) ? data : [];
        setItems(arr);
        setMsg("");
      } catch (e) {
        setMsg(`❌ ${e.message}`);
      }
    })();
  }, []);

  const sorted = useMemo(() => {
    const now = new Date();
    return [...items]
      .filter((t) => t?.eventStartAt && new Date(t.eventStartAt) >= new Date(now.getTime() - 1000 * 60 * 60 * 24))
      .sort((a, b) => new Date(a.eventStartAt) - new Date(b.eventStartAt))
      .slice(0, limit);
  }, [items, limit]);

  const prettyDate = (d) => {
    try {
      return new Date(d).toLocaleDateString("pl-PL");
    } catch {
      return "—";
    }
  };

  const prettyTime = (d) => {
    try {
      return new Date(d).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const eventText = (t) => {
    const s = t?.eventStartAt ? new Date(t.eventStartAt) : null;
    if (!s) return "—";
    const sDate = prettyDate(s);
    const sTime = prettyTime(s);
    return sTime ? `${sDate} • ${sTime}` : sDate;
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.head}>
          <div>
            <h2>
              Turnieje <span>SPIKEZONE</span>
            </h2>
            <p>Dołącz do turniejów publikowanych przez SPIKEZONE.</p>
          </div>

          <button className={styles.cta} onClick={() => navigate("/tournaments")} type="button">
            Zobacz wszystkie <FaArrowRight />
          </button>
        </div>

        {msg && <div className={styles.msg}>{msg}</div>}

        {!msg && sorted.length === 0 && (
          <div className={styles.msg}>Brak nadchodzących turniejów do wyświetlenia.</div>
        )}

        <div className={styles.grid}>
          {sorted.map((t) => (
            <button
              key={t._id}
              className={styles.card}
              onClick={() => navigate(`/tournaments/${t.slug}`)}
              type="button"
              aria-label={`Otwórz turniej ${t.title}`}
            >
              <div className={styles.cardTop}>
                <div className={styles.icon}>
                  <FaTrophy />
                </div>

                <span className={styles.pill}>
                  <FaCalendarAlt /> {eventText(t)}
                </span>
              </div>

              <div className={styles.title}>{t.title}</div>

              <div className={styles.meta}>
                <span className={styles.metaSoft}>{t.city || "—"}</span>
                {!!t.venue && <span className={styles.metaSep}>•</span>}
                {!!t.venue && <span className={styles.metaStrong}>{t.venue}</span>}
              </div>

              <div className={styles.footer}>
                <span className={styles.open}>
                  Szczegóły <FaArrowRight />
                </span>

                <span className={styles.hint}>
                  <FaClock /> Zapisy zależne od okna
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
