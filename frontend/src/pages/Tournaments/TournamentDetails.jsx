import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./Tournaments.module.scss";

const API = "http://localhost:5000";

export default function TournamentDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [t, setT] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const res = await fetch(`${API}/api/tournaments/${slug}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Nie znaleziono turnieju");
        setT(data);
      } catch (e) {
        setErr(e.message);
        setT(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <button className={styles.back} onClick={() => navigate("/tournaments")}>
          ← Wróć do listy
        </button>

        {loading && <div className={styles.msg}>Ładowanie...</div>}
        {err && <div className={`${styles.msg} ${styles.err}`}>❌ {err}</div>}

        {!loading && t && (
          <div className={styles.details}>
            <h1 className={styles.detailsTitle}>{t.title}</h1>

            <div className={styles.detailsMeta}>
              <span className={styles.badge}>{t.city || "—"}</span>
              {!!t.venue && <span className={styles.badge}>{t.venue}</span>}
              <span className={styles.badge}>
                {new Date(t.startDate).toLocaleDateString("pl-PL")} –{" "}
                {new Date(t.endDate).toLocaleDateString("pl-PL")}
              </span>
              <span className={styles.badge}>Limit: {t.teamLimit ?? 16}</span>
              <span className={styles.badge}>Wpisowe: {t.entryFee ?? 0} zł</span>
            </div>

            {t.description ? (
              <div className={styles.desc}>
                {t.description}
              </div>
            ) : (
              <div className={styles.msg}>Brak opisu turnieju.</div>
            )}

            {/* MVP: teamy */}
            <div className={styles.section}>
              <h2>Drużyny (MVP)</h2>
              {Array.isArray(t.teams) && t.teams.length > 0 ? (
                <ul className={styles.teamList}>
                  {t.teams.map((x, i) => (
                    <li key={i} className={styles.teamItem}>
                      <strong>{x.name}</strong>
                      {(x.captainName || x.captainPhone) && (
                        <span className={styles.teamSub}>
                          {x.captainName || "—"} {x.captainPhone ? `• ${x.captainPhone}` : ""}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={styles.msg}>Na razie brak zapisanych drużyn.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
