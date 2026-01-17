import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api/api";
import styles from "./Teams.module.scss";
import { FaUsers, FaCheckCircle, FaClock, FaArrowRight } from "react-icons/fa";

export default function Teams() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("Ładowanie...");

  useEffect(() => {
    (async () => {
      try {
        setMsg("Ładowanie...");
        const data = await apiFetch("/api/teams");
        setItems(Array.isArray(data) ? data : []);
        setMsg("");
      } catch (e) {
        setMsg(`❌ ${e.message}`);
      }
    })();
  }, []);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "pl")
    );
  }, [items]);

  const badgeFor = (t) => {
    const s = String(t.status || "").toLowerCase();
    if (s === "approved") return { icon: <FaCheckCircle />, text: "Zaakceptowana", tone: "ok" };
    if (s === "pending") return { icon: <FaClock />, text: "W trakcie", tone: "pending" };
    return { icon: <FaUsers />, text: t.status || "Drużyna", tone: "default" };
  };

  return (
    <section className={styles.section}>
      <div className={styles.bgGlow} aria-hidden="true" />

      <div className={styles.header}>
        <h1>
          Drużyny <span>SPIKEZONE</span>
        </h1>
        <p className={styles.sub}>Kliknij drużynę, aby zobaczyć szczegóły oraz skład.</p>
      </div>

      <div className={styles.container}>
        {msg && <div className={styles.msg}>{msg}</div>}

        {!msg && sorted.length === 0 && (
          <div className={styles.msg}>Brak zaakceptowanych drużyn.</div>
        )}

        <div className={styles.grid}>
          {sorted.map((t) => {
            const b = badgeFor(t);
            const membersCount = t.members?.length || 0;

            return (
              <button
                key={t._id}
                className={styles.card}
                onClick={() => navigate(`/teams/${t.slug}`)}
                type="button"
                aria-label={`Otwórz drużynę ${t.name}`}
              >
                {/* MEDIA */}
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

                  {/* top-right pills na bannerze */}
                  <div className={styles.cornerPills}>
                    <span className={styles.pillSoft}>{membersCount} zawodników</span>
                  </div>
                </div>

                {/* TOP ROW */}
                <div className={styles.top}>
                  <div className={styles.icon}>
                    <FaUsers />
                  </div>

                  <div className={`${styles.badge} ${styles[`badge_${b.tone}`]}`}>
                    {b.icon} {b.text}
                  </div>
                </div>

                <div className={styles.title} title={t.name}>
                  {t.name}
                </div>

                {t.description ? (
                  <div className={styles.desc}>
                    {String(t.description).slice(0, 140)}
                    {String(t.description).length > 140 ? "..." : ""}
                  </div>
                ) : (
                  <div className={styles.descMuted}>Brak opisu drużyny.</div>
                )}

                <div className={styles.footer}>
                  <span className={styles.open}>
                    Zobacz szczegóły drużyny<FaArrowRight />
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
