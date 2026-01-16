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
        const data = await apiFetch("/api/teams"); // public
        setItems(Array.isArray(data) ? data : []);
        setMsg("");
      } catch (e) {
        setMsg(`❌ ${e.message}`);
      }
    })();
  }, []);

  const sorted = useMemo(() => {
    // alfabetycznie (możesz zmienić na np. po createdAt jeśli masz)
    return [...items].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "pl"));
  }, [items]);

  const badgeFor = (t) => {
    const s = String(t.status || "").toLowerCase();
    if (s === "approved") return { icon: <FaCheckCircle />, text: "Zaakceptowana" };
    if (s === "pending") return { icon: <FaClock />, text: "W trakcie" };
    return { icon: <FaUsers />, text: (t.status || "Drużyna") };
  };

  return (
    <section className={styles.section}>
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
                <div className={styles.top}>
                  <div className={styles.icon}>
                    <FaUsers />
                  </div>

                  <div className={styles.badge}>
                    {b.icon} {b.text}
                  </div>
                </div>

                <div className={styles.title}>{t.name}</div>

                <div className={styles.meta}>
                  <span className={styles.metaItem}>
                    <FaUsers />
                    {membersCount} zawodników
                  </span>
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
                  <span className={styles.pill}>Status: {t.status || "—"}</span>
                  <span className={styles.pill}>Skład: {membersCount}</span>

                  <span className={styles.open}>
                    Zobacz <FaArrowRight />
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
