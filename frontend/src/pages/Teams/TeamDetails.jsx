import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../api/api";
import styles from "./TeamDetails.module.scss";

export default function TeamDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [msg, setMsg] = useState("Ładowanie...");

  const membersCount = useMemo(() => team?.members?.length || 0, [team]);

  useEffect(() => {
    (async () => {
      try {
        setMsg("Ładowanie...");
        const data = await apiFetch(`/api/teams/${slug}`);
        setTeam(data);
        setMsg("");
      } catch (e) {
        setMsg(`❌ ${e.message}`);
      }
    })();
  }, [slug]);

  return (
    <section className={styles.section}>
      <div className={styles.bgGlow} aria-hidden="true" />
      <div className={styles.container}>
        <button
          className={styles.backModern}
          onClick={() => navigate("/teams")}
          type="button"
        >
          <span className={styles.backIcon}>←</span>
          <span>Wróć do listy</span>
        </button>

        {msg && <div className={styles.msg}>{msg}</div>}

        {team && (
          <div className={styles.detailsCard}>
            {/* HEADER */}
            <div className={styles.top}>
              <div className={styles.media}>
                {team.bannerUrl ? (
                  <img
                    className={styles.banner}
                    src={team.bannerUrl}
                    alt={`Banner drużyny ${team.name}`}
                    loading="lazy"
                    draggable="false"
                  />
                ) : (
                  <div className={styles.bannerFallback} />
                )}

                <div className={styles.mediaOverlay} />

                {/* ✅ identycznie jak MyTeam: logo | headerText | headerActions */}
                <div className={styles.coverBar}>
                  <div className={styles.logoWrap}>
                    {team.logoUrl ? (
                      <img
                        className={styles.logo}
                        src={team.logoUrl}
                        alt={`Logo drużyny ${team.name}`}
                        loading="lazy"
                        draggable="false"
                      />
                    ) : (
                      <div className={styles.logoPlaceholder}>
                        {String(team.name || "?").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className={styles.headerText}>
                    <h1 className={styles.teamName}>{team.name}</h1>

                    <div className={styles.pills}>
                      <span className={`${styles.pillSoft} ${styles.pillOk}`}>
                        <span className={styles.dot} />
                        Zaakceptowana
                      </span>

                      <span className={styles.pillSoft}>
                        {membersCount} zawodników
                      </span>
                    </div>
                  </div>

                  {/* ✅ pusta kolumna, żeby układ był 1:1 jak w MyTeam */}
                  <div className={styles.headerActions} aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* OPIS */}
            <div className={styles.block}>
              <div className={styles.blockHead}>
                <div className={styles.blockTitle}>
                  <h2>Opis drużyny</h2>
                  <span className={styles.blockSub}>Informacje o zespole</span>
                </div>
                <span className={styles.blockBadge}>INFO</span>
              </div>

              {team.description ? (
                <div className={styles.desc}>{team.description}</div>
              ) : (
                <div className={styles.msgInline}>Brak opisu drużyny.</div>
              )}
            </div>

            {/* SKŁAD */}
            <div className={styles.block}>
              <div className={styles.blockHead}>
                <div className={styles.blockTitle}>
                  <h2>Skład</h2>
                  <span className={styles.blockSub}>
                    Lista zawodników w drużynie
                  </span>
                </div>
                <span className={styles.blockBadge}>{membersCount}</span>
              </div>

              <ul className={styles.membersGrid}>
                {(team.members || []).map((m, idx) => (
                  <li key={idx} className={styles.memberCard}>
                    <div className={styles.memberLeft}>
                      <span className={styles.memberIndex}>
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className={styles.memberName}>{m.fullName}</span>
                    </div>
                    <span className={styles.memberTag}>ZAWODNIK</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
