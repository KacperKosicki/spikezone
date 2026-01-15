import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api/api";
import styles from "./Teams.module.scss";

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

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <div className={styles.head}>
          <h1 className={styles.h1}>Drużyny</h1>
          <p className={styles.sub}>Lista zaakceptowanych drużyn w SPIKEZONE.</p>
        </div>

        {msg && <div className={styles.msg}>{msg}</div>}

        <div className={styles.grid}>
          {items.map((t) => (
            <button
              key={t._id}
              className={styles.card}
              onClick={() => navigate(`/teams/${t.slug}`)}
              type="button"
              aria-label={`Otwórz drużynę ${t.name}`}
            >
              {/* COVER */}
              <div className={styles.cover}>
                {t.bannerUrl ? (
                  <img className={styles.coverImg} src={t.bannerUrl} alt="" />
                ) : (
                  <div className={styles.coverFallback} />
                )}
                <div className={styles.coverShade} />

                {/* AVATAR (na coverze) */}
                <div className={styles.avatarWrap}>
                  {t.logoUrl ? (
                    <img className={styles.avatar} src={t.logoUrl} alt="" />
                  ) : (
                    <div className={styles.avatarFallback}>
                      {String(t.name || "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* CONTENT */}
              <div className={styles.body}>
                <div className={styles.titleRow}>
                  <div className={styles.title}>{t.name}</div>
                  <span className={styles.badge}>{t.members?.length || 0} zawodników</span>
                </div>

                {t.description ? (
                  <div className={styles.desc}>
                    {String(t.description).slice(0, 140)}
                    {String(t.description).length > 140 ? "..." : ""}
                  </div>
                ) : (
                  <div className={styles.descMuted}>Brak opisu drużyny.</div>
                )}

                <div className={styles.openRow}>
                  <span className={styles.open}>Otwórz</span>
                  <span className={styles.arrow}>→</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
