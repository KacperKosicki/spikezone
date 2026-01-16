// TournamentDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./TournamentDetails.module.scss";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaRegMoneyBillAlt,
  FaUsers,
  FaTrophy,
  FaMapPin,
} from "react-icons/fa";

import { apiFetch } from "../../api/api";
import { auth } from "../../firebase";

const API = "http://localhost:5000";
const INTENT_KEY = "tournamentIntent";
const FLASH_KEY = "teamFlash";

export default function TournamentDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [t, setT] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // registrations
  const [regs, setRegs] = useState({ stats: { count: 0, limit: 0 }, items: [] });

  // akcja zgłoszenia
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // modal + auto redirect
  const [modal, setModal] = useState({
    open: false,
    title: "",
    text: "",
    to: "",
    seconds: 0,
  });

  // odliczanie w modalu
  const [countdown, setCountdown] = useState(0);

  function openRedirectModal({ title, text, to, seconds = 10 }) {
    setModal({ open: true, title, text, to, seconds });
    setCountdown(seconds);

    window.clearTimeout(openRedirectModal._t);
    window.clearInterval(openRedirectModal._i);

    openRedirectModal._i = window.setInterval(() => {
      setCountdown((s) => {
        if (s <= 1) {
          window.clearInterval(openRedirectModal._i);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    openRedirectModal._t = window.setTimeout(() => {
      window.clearInterval(openRedirectModal._i);
      setModal((m) => ({ ...m, open: false }));
      navigate(to, { state: { flash: text } });
    }, seconds * 1000);
  }

  // cleanup przy unmount
  useEffect(() => {
    return () => {
      window.clearTimeout(openRedirectModal._t);
      window.clearInterval(openRedirectModal._i);
    };
  }, []);

  async function fetchRegistrations(currentSlug) {
    try {
      const res = await fetch(`${API}/api/tournaments/${currentSlug}/registrations`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) setRegs(data);
    } catch {
      // nie blokujemy widoku
    }
  }

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);

        const res = await fetch(`${API}/api/tournaments/${slug}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Nie znaleziono turnieju");
        setT(data);

        await fetchRegistrations(slug);
      } catch (e) {
        setErr(e.message);
        setT(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const dateText = useMemo(() => {
    if (!t?.startDate || !t?.endDate) return "—";
    return `${new Date(t.startDate).toLocaleDateString("pl-PL")} – ${new Date(
      t.endDate
    ).toLocaleDateString("pl-PL")}`;
  }, [t?.startDate, t?.endDate]);

  const registeredCount = regs?.stats?.count ?? 0;
  const registeredLimit = regs?.stats?.limit ?? (t?.teamLimit ?? 16);
  const isFull = registeredCount >= registeredLimit;

  async function handleRegister() {
    setActionMsg("");
    setActionErr("");

    if (!auth.currentUser) {
      openRedirectModal({
        title: "Musisz być zalogowany",
        text: "Aby zgłosić drużynę do turnieju, musisz się zalogować. Za chwilę przeniesiemy Cię do logowania.",
        to: "/login",
        seconds: 10,
      });
      return;
    }

    setActionLoading(true);

    try {
      const data = await apiFetch(`/api/tournaments/${slug}/register`, { method: "POST" });
      setActionMsg(data?.message || "✅ Zapisano drużynę do turnieju.");
      await fetchRegistrations(slug);
    } catch (e) {
      const code = e?.code;

      if (code === "UNAUTHORIZED") {
        openRedirectModal({
          title: "Zaloguj się ponownie",
          text: "Twoja sesja wygasła lub nie masz dostępu. Zaloguj się, aby zgłosić drużynę.",
          to: "/login",
          seconds: 10,
        });
        return;
      }

      if (code === "NEED_TEAM") {
        sessionStorage.setItem(
          INTENT_KEY,
          JSON.stringify({ slug, action: "register", from: `/tournaments/${slug}` })
        );

        sessionStorage.setItem(
          FLASH_KEY,
          "Aby zgłosić się do turnieju, musisz utworzyć drużynę. Za chwilę przeniesiemy Cię do formularza."
        );

        openRedirectModal({
          title: "Najpierw utwórz drużynę",
          text: "Nie masz jeszcze drużyny. Za chwilę przeniesiemy Cię do tworzenia drużyny.",
          to: "/team/create",
          seconds: 10,
        });
        return;
      }

      if (code === "TEAM_NOT_APPROVED") {
        setActionErr("Twoja drużyna nie jest jeszcze zaakceptowana. Poczekaj na decyzję administratora.");
        return;
      }

      if (code === "TOURNAMENT_FULL") {
        setActionErr("Limit drużyn został osiągnięty — nie możesz już dołączyć do tego turnieju.");
        return;
      }

      if (code === "ALREADY_REGISTERED") {
        setActionErr("Twoja drużyna jest już zapisana do tego turnieju.");
        return;
      }

      setActionErr(e?.message || "Nie udało się zgłosić drużyny.");
    } finally {
      setActionLoading(false);
    }
  }

  // auto-proba po create team / login
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(INTENT_KEY);
      if (!raw) return;
      const intent = JSON.parse(raw);

      if (intent?.slug === slug && intent?.action === "register") {
        sessionStorage.removeItem(INTENT_KEY);
        handleRegister();
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const showNotApprovedActions =
    actionErr && actionErr.toLowerCase().includes("nie jest zaakceptowana");

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <button className={styles.backModern} onClick={() => navigate("/tournaments")} type="button">
          <FaArrowLeft /> Wróć do listy
        </button>

        {loading && <div className={styles.msg}>Ładowanie...</div>}
        {err && <div className={`${styles.msg} ${styles.err}`}>❌ {err}</div>}

        {/* MODAL */}
        {modal.open && (
          <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
            <div className={styles.modalCard}>
              <h3 className={styles.modalTitle}>{modal.title}</h3>
              <p className={styles.modalText}>{modal.text}</p>

              <div className={styles.modalActions}>
                <button
                  className={styles.btnPrimary}
                  type="button"
                  onClick={() => {
                    window.clearTimeout(openRedirectModal._t);
                    window.clearInterval(openRedirectModal._i);

                    setModal((m) => ({ ...m, open: false }));
                    navigate(modal.to, { state: { flash: modal.text } });
                  }}
                >
                  Przejdź teraz
                </button>

                <button
                  className={styles.btnGhost}
                  type="button"
                  onClick={() => {
                    window.clearTimeout(openRedirectModal._t);
                    window.clearInterval(openRedirectModal._i);

                    setModal((m) => ({ ...m, open: false }));
                    setCountdown(0);
                  }}
                >
                  Zamknij
                </button>
              </div>

              {!!modal.seconds && <div className={styles.modalHint}>Przekierowanie za {countdown}s…</div>}
            </div>
          </div>
        )}

        {!loading && t && (
          <div className={styles.detailsCard}>
            {/* TOP */}
            <div className={styles.detailsTop}>
              <div className={styles.detailsIcon}>
                <FaTrophy />
              </div>

              <div className={styles.detailsHead}>
                <h1 className={styles.detailsTitle}>{t.title}</h1>

                <div className={styles.detailsMetaRow}>
                  <span className={styles.pillSoft}>
                    <FaCalendarAlt /> {dateText}
                  </span>

                  <span className={styles.pillSoft}>
                    <FaMapMarkerAlt /> {t.city || "—"}
                  </span>

                  {!!t.venue && (
                    <span className={styles.pillSoft}>
                      <FaMapPin /> {t.venue}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* STATS */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>
                  <FaUsers /> Limit drużyn
                </div>
                <div className={styles.statValue}>{t.teamLimit ?? 16}</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statLabel}>
                  <FaRegMoneyBillAlt /> Wpisowe
                </div>
                <div className={styles.statValue}>{t.entryFee ?? 0} zł</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statLabel}>
                  <FaUsers /> Zgłoszone
                </div>
                <div className={styles.statValue}>
                  {registeredCount}/{registeredLimit}
                </div>
              </div>
            </div>

            {/* REGISTER BLOCK */}
            <div className={styles.block}>
              <div className={styles.blockHead}>
                <h2>Zgłoszenie</h2>
                <span className={styles.blockBadge}>Dla zalogowanych</span>
              </div>

              {actionMsg && (
                <div className={styles.msgInline}>
                  ✅ {String(actionMsg).replace(/^(\s*✅\s*)+/, "")}
                </div>
              )}

              {actionErr && (
                <div className={`${styles.msgInline} ${styles.err}`}>
                  ❌ {String(actionErr).replace(/^(\s*❌\s*)+/, "")}
                </div>
              )}

              <button
                className={styles.btnPrimary}
                onClick={handleRegister}
                disabled={actionLoading || isFull}
                type="button"
                title={isFull ? "Limit osiągnięty" : "Zgłoś swoją drużynę"}
              >
                {isFull ? "Limit osiągnięty" : actionLoading ? "Zapisywanie..." : "Zgłoś drużynę"}
              </button>

              {showNotApprovedActions && (
                <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className={styles.btnGhost} type="button" onClick={() => navigate("/team/me")}>
                    Moja drużyna
                  </button>
                  <button className={styles.btnGhost} type="button" onClick={() => navigate("/team/edit")}>
                    Edytuj drużynę
                  </button>
                </div>
              )}
            </div>

            {/* DESCRIPTION */}
            <div className={styles.block}>
              <div className={styles.blockHead}>
                <h2>Opis</h2>
                <span className={styles.blockBadge}>Informacje organizacyjne</span>
              </div>

              {t.description ? <div className={styles.desc}>{t.description}</div> : <div className={styles.msgInline}>Brak opisu turnieju.</div>}
            </div>

            {/* REGISTERED TEAMS */}
            <div className={styles.block}>
              <div className={styles.blockHead}>
                <h2>Zgłoszone drużyny</h2>
                <span className={styles.blockBadge}>
                  {registeredCount}/{registeredLimit}
                </span>
              </div>

              {Array.isArray(regs?.items) && regs.items.length > 0 ? (
                <ul className={styles.teamsGrid}>
                  {regs.items.map((x) => {
                    const banner = x.teamBannerUrl || x.bannerUrl || x.team?.bannerUrl || "";
                    const logo = x.teamLogoUrl || x.logoUrl || x.team?.logoUrl || "";
                    const name = x.teamName || x.name || x.team?.name || "Drużyna";
                    const teamSlug = x.teamSlug || x.team?.slug || "";

                    const goTeam = () => {
                      if (!teamSlug) return;
                      navigate(`/teams/${teamSlug}`);
                    };

                    return (
                      <li
                        key={x._id || teamSlug || name}
                        className={styles.teamCard}
                        role="button"
                        tabIndex={0}
                        aria-label={`Otwórz drużynę ${name}`}
                        onClick={goTeam}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            goTeam();
                          }
                        }}
                      >
                        {banner ? (
                          <div className={styles.teamCoverImage} style={{ backgroundImage: `url("${banner}")` }} />
                        ) : (
                          <div className={styles.teamCoverPlaceholder} />
                        )}

                        <div className={styles.teamCoverOverlay} />

                        <div className={styles.teamContent}>
                          <div className={styles.teamLeft}>
                            <div className={styles.teamLogoWrap}>
                              {logo ? (
                                <img src={logo} alt={name} className={styles.teamLogo} loading="lazy" />
                              ) : (
                                <div className={styles.teamLogoFallback}>
                                  {String(name || "?").trim().charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>

                            <div className={styles.teamInfo}>
                              <strong className={styles.teamCardName}>{name}</strong>

                              {!!x.createdAt && (
                                <div className={styles.teamCardMeta}>
                                  Zgłoszono: {new Date(x.createdAt).toLocaleDateString("pl-PL")}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className={styles.teamChip} onClick={(e) => e.stopPropagation()}>
                            Zapisana
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className={styles.msgInline}>Na razie brak zgłoszeń.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
