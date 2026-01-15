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
      ? "ROZPATRYWANIE"
      : team.status === "rejected"
      ? "ODRZUCONA"
      : "ZAAKCEPTOWANA";
  }, [team]);

  const isPending = team?.status === "pending";
  const bannerBg = team?.bannerUrl || "";
  const logoImg = team?.logoUrl || "";

  if (msg && !team) {
    return (
      <section className={styles.page}>
        <div className={styles.container}>
          <button className={styles.back} onClick={() => navigate("/teams")}>
            ← Wróć
          </button>
          <div className={styles.msg}>{msg}</div>
        </div>
      </section>
    );
  }

  if (!team) {
    return (
      <section className={styles.page}>
        <div className={styles.container}>
          <button className={styles.back} onClick={() => navigate("/teams")}>
            ← Wróć
          </button>
          <div className={styles.msg}>Nie masz drużyny. Utwórz ją tutaj:</div>
          <button className={styles.btnPrimary} onClick={() => navigate("/team/create")}>
            Stwórz drużynę
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <button className={styles.back} onClick={() => navigate("/teams")}>
          ← Wróć
        </button>

        {/* ✅ komunikat po edycji */}
        {flash && <div className={styles.msg}>{flash}</div>}

        <div className={styles.shell}>
          <div className={styles.cover}>
            {bannerBg ? (
              <div
                className={styles.coverImage}
                style={{ backgroundImage: `url("${bannerBg}")` }}
              />
            ) : (
              <div className={styles.coverPlaceholder} />
            )}

            <div className={styles.coverOverlay} />

            <div className={styles.coverBar}>
              <div className={styles.logoWrap}>
                {logoImg ? (
                  <img className={styles.logo} src={logoImg} alt="Logo drużyny" />
                ) : (
                  <div className={styles.logoPlaceholder}>LOGO</div>
                )}
              </div>

              <div className={styles.headerText}>
                <h1 className={styles.teamName}>{team.name}</h1>

                <div className={styles.metaRow}>
                  <span className={styles.badge}>{statusText}</span>
                  <span className={styles.badge}>
                    {team.members?.length || 0} zawodników
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
                >
                  {isPending ? "Edycja zablokowana" : "Edytuj drużynę"}
                </button>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            {team.adminNote && (
              <div className={styles.note}>
                <strong>Uwaga od admina:</strong> {team.adminNote}
              </div>
            )}

            {team.description && <p className={styles.desc}>{team.description}</p>}

            <div className={styles.section}>
              <h2>Skład</h2>
              <ul className={styles.teamList}>
                {(team.members || []).map((m, idx) => (
                  <li key={idx} className={styles.teamItem}>
                    <strong>{m.fullName}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {isPending && (
            <div className={styles.pendingInfo}>
              ⏳ Twoja drużyna jest w trakcie rozpatrywania. W tym czasie nie możesz
              zmieniać żadnych danych (w tym logo i bannera). Edycja będzie dostępna
              po decyzji admina.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
