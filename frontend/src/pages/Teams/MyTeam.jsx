import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../../api/api";
import styles from "./MyTeam.module.scss";

const FLASH_KEY = "teamFlash";

export default function MyTeam() {
  const navigate = useNavigate();
  const location = useLocation();

  const [team, setTeam] = useState(null);
  const [msg, setMsg] = useState("Ładowanie...");
  const [flash, setFlash] = useState("");

  // flash: najpierw z navigate(state), potem z sessionStorage (po hard redirect)
  useEffect(() => {
    if (location.state?.flash) {
      setFlash(location.state.flash);
      return;
    }

    try {
      const s = sessionStorage.getItem(FLASH_KEY);
      if (s) {
        setFlash(s);
        sessionStorage.removeItem(FLASH_KEY);
      }
    } catch {}
  }, [location.state]);

  useEffect(() => {
    (async () => {
      try {
        setMsg("Ładowanie...");
        const data = await apiFetch("/api/team/me");
        setTeam(data);
        setMsg("");
      } catch (e) {
        setMsg(`❌ ${e.message}`);
      }
    })();
  }, []);

  const statusText = useMemo(() => {
    if (!team) return "";
    return team.status === "pending"
      ? "Rozpatrywanie"
      : team.status === "rejected"
      ? "Odrzucona"
      : "Zaakceptowana";
  }, [team]);

  const isPending = team?.status === "pending";
  const membersCount = useMemo(() => team?.members?.length || 0, [team]);

  // loading
  if (msg && !team) {
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

          <div className={styles.msg}>{msg}</div>
        </div>
      </section>
    );
  }

  // no team
  if (!team) {
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

          <div className={styles.msg}>Nie masz drużyny. Utwórz ją tutaj:</div>

          <button
            className={styles.btnPrimary}
            onClick={() => navigate("/team/create")}
            type="button"
          >
            Stwórz drużynę
          </button>
        </div>
      </section>
    );
  }

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

        {/* ✅ komunikat po edycji */}
        {flash && <div className={styles.msg}>{flash}</div>}

        <div className={styles.detailsCard}>
          {/* HEADER (jak TeamDetails) */}
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

              {/* ✅ coverBar: logo | headerText | headerActions */}
              <div className={styles.coverBar}>
                <div className={styles.logoWrap}>
                  {team.logoUrl ? (
                    <img
                      className={styles.logo}
                      src={team.logoUrl}
                      alt="Logo drużyny"
                      loading="lazy"
                      draggable="false"
                    />
                  ) : (
                    <div className={styles.logoFallback}>
                      {String(team.name || "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className={styles.headerText}>
                  <h1 className={styles.teamName}>{team.name}</h1>

                  <div className={styles.pills}>
                    <span
                      className={`${styles.pillSoft} ${
                        team.status === "rejected" ? styles.pillBad : styles.pillOk
                      }`}
                    >
                      <span
                        className={`${styles.dot} ${
                          team.status === "rejected" ? styles.dotBad : ""
                        }`}
                      />
                      {statusText}
                    </span>

                    <span className={styles.pillSoft}>
                      {membersCount} zawodników
                    </span>
                  </div>
                </div>

                <div className={styles.headerActions}>
                  <button
                    className={styles.btnGhost}
                    onClick={() => navigate("/team/edit")}
                    disabled={isPending}
                    title={
                      isPending
                        ? "Drużyna jest w trakcie rozpatrywania – edycja zablokowana"
                        : "Edytuj drużynę"
                    }
                    type="button"
                  >
                    {isPending ? "Edycja zablokowana" : "Edytuj drużynę"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* BODY */}
          {team.adminNote && (
            <div className={styles.note}>
              <strong>Uwaga od administratora:</strong> {team.adminNote}
            </div>
          )}

          {/* OPIS (jak TeamDetails) */}
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

          {/* SKŁAD (jak TeamDetails) */}
          <div className={styles.block}>
            <div className={styles.blockHead}>
              <div className={styles.blockTitle}>
                <h2>Skład</h2>
                <span className={styles.blockSub}>Lista zawodników w drużynie</span>
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

          {/* pending info */}
          {isPending && (
            <div className={styles.pendingInfo}>
              ⏳ Twoja drużyna jest w trakcie rozpatrywania. W tym czasie nie możesz
              zmieniać żadnych danych. Edycja będzie dostępna
              po decyzji administratora.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
