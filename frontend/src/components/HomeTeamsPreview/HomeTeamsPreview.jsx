import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api/api";
import styles from "./HomeTeamsPreview.module.scss";
import { FaUsers, FaArrowRight, FaCheckCircle } from "react-icons/fa";

export default function HomeTeamsPreview({ limit = 6 }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("Ładowanie...");

  useEffect(() => {
    (async () => {
      try {
        setMsg("Ładowanie...");
        const data = await apiFetch("/api/teams");
        const arr = Array.isArray(data) ? data : [];
        setItems(arr);
        setMsg("");
      } catch (e) {
        setMsg(`❌ ${e.message}`);
      }
    })();
  }, []);

  const sorted = useMemo(() => {
    const approved = [...items].filter((t) => String(t.status || "").toLowerCase() === "approved");
    return approved
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "pl"))
      .slice(0, limit);
  }, [items, limit]);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.head}>
          <div>
            <h2>
              Drużyny <span>SPIKEZONE</span>
            </h2>
            <p>Wybrane zaakceptowane drużyny. Pełna lista w zakładce Drużyny.</p>
          </div>

          <button className={styles.cta} onClick={() => navigate("/teams")} type="button">
            Zobacz wszystkie <FaArrowRight />
          </button>
        </div>

        {msg && <div className={styles.msg}>{msg}</div>}

        {!msg && sorted.length === 0 && <div className={styles.msg}>Brak drużyn do wyświetlenia.</div>}

        <div className={styles.grid}>
          {sorted.map((t) => {
            const membersCount = t.members?.length || 0;

            return (
              <button
                key={t._id}
                className={styles.card}
                onClick={() => navigate(`/teams/${t.slug}`)}
                type="button"
                aria-label={`Otwórz drużynę ${t.name}`}
              >
                {/* MEDIA (banner + logo) */}
                <div className={styles.media}>
                  {t.bannerUrl ? (
                    <img
                      className={styles.banner}
                      src={t.bannerUrl}
                      alt={`Banner drużyny ${t.name}`}
                      loading="lazy"
                      draggable="false"
                    />
                  ) : (
                    <div className={styles.bannerFallback} />
                  )}

                  <div className={styles.mediaOverlay} />

                  <div className={styles.logoWrap}>
                    {t.logoUrl ? (
                      <img
                        className={styles.logo}
                        src={t.logoUrl}
                        alt={`Logo drużyny ${t.name}`}
                        loading="lazy"
                        draggable="false"
                      />
                    ) : (
                      <div className={styles.logoFallback}>
                        {String(t.name || "?").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className={styles.cornerPills}>
                    <span className={styles.pillSoft}>{membersCount} zawodników</span>
                  </div>
                </div>

                {/* TOP ROW */}
                <div className={styles.top}>
                  <div className={styles.icon}>
                    <FaUsers />
                  </div>

                  <span className={styles.badge}>
                    <FaCheckCircle /> Zaakceptowana
                  </span>
                </div>

                <div className={styles.title} title={t.name}>
                  {t.name}
                </div>

                {/* opcjonalnie opis - jeśli nie chcesz na home, usuń ten blok */}
                {t.description ? (
                  <div className={styles.desc}>
                    {String(t.description).slice(0, 120)}
                    {String(t.description).length > 120 ? "..." : ""}
                  </div>
                ) : (
                  <div className={styles.descMuted}>Brak opisu drużyny.</div>
                )}

                <div className={styles.footer}>
                  <span className={styles.open}>
                    Szczegóły <FaArrowRight />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
