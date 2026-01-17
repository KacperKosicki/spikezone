// TournamentDetails.jsx
import { useEffect, useMemo, useState, useRef } from "react";
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
  FaClock,
} from "react-icons/fa";

import { apiFetch } from "../../api/api";
import { auth } from "../../firebase";

const API = "http://localhost:5000";
const INTENT_KEY = "tournamentIntent";
const FLASH_KEY = "teamFlash";

export default function TournamentDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const redirectTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);

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

  const cancelRedirect = () => {
    if (redirectTimeoutRef.current) {
      window.clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  function openRedirectModal({ title, text, to, seconds = 10 }) {
    // ✅ zawsze ubij poprzednie timery
    cancelRedirect();

    setModal({ open: true, title, text, to, seconds });
    setCountdown(seconds);

    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown((s) => {
        if (s <= 1) {
          // kończymy odliczanie, ale timeout i tak zrobi nawigację
          window.clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    redirectTimeoutRef.current = window.setTimeout(() => {
      // ✅ domknij timery i dopiero nawiguj
      cancelRedirect();
      setModal((m) => ({ ...m, open: false }));
      navigate(to, { state: { flash: text } });
    }, seconds * 1000);
  }

  useEffect(() => {
    return () => cancelRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const prettyDateTime = (d) => {
    try {
      if (!d) return "—";
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return "—";
      return dt.toLocaleString("pl-PL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const diffHuman = (futureOrPastDate) => {
    // zwraca np: { days: 2, hours: 5, minutes: 10, isPast: false }
    try {
      const now = new Date();
      const target = new Date(futureOrPastDate);
      if (Number.isNaN(target.getTime())) return null;

      const ms = target.getTime() - now.getTime();
      const isPast = ms < 0;
      const abs = Math.abs(ms);

      const minutes = Math.floor(abs / (1000 * 60));
      const hours = Math.floor(abs / (1000 * 60 * 60));
      const days = Math.floor(abs / (1000 * 60 * 60 * 24));

      const remHours = hours - days * 24;
      const remMinutes = minutes - hours * 60;

      return { days, hours: remHours, minutes: remMinutes, isPast };
    } catch {
      return null;
    }
  };

  const dateRangeEvent = useMemo(() => {
    // jeśli masz eventEndAt -> pokazz zakres, jeśli nie -> tylko start
    const s = t?.eventStartAt ? new Date(t.eventStartAt) : null;
    const e = t?.eventEndAt ? new Date(t.eventEndAt) : null;

    const hasS = s && !Number.isNaN(s.getTime());
    const hasE = e && !Number.isNaN(e.getTime());

    if (!hasS && !hasE) return "—";
    if (hasS && !hasE) return prettyDateTime(s);
    return `${prettyDateTime(s)} – ${prettyDateTime(e)}`;
  }, [t?.eventStartAt, t?.eventEndAt]);

  const registeredCount = regs?.stats?.count ?? 0;
  const registeredLimit = regs?.stats?.limit ?? (t?.teamLimit ?? 16);
  const isFull = registeredCount >= registeredLimit;

  // status turnieju (na podstawie eventStartAt / eventEndAt)
  const tournamentStatus = useMemo(() => {
    const now = new Date();
    const s = t?.eventStartAt ? new Date(t.eventStartAt) : null;
    const e = t?.eventEndAt ? new Date(t.eventEndAt) : null;

    const hasS = s && !Number.isNaN(s.getTime());
    const hasE = e && !Number.isNaN(e.getTime());

    if (hasE && now > e) return { text: "Zakończony", tone: "done" };
    if (hasS && now >= s && (!hasE || now <= e)) return { text: "Trwa", tone: "live" };
    if (hasS) {
      const d = diffHuman(s);
      if (d && !d.isPast && d.days <= 7) return { text: "Już wkrótce", tone: "soon" };
      return { text: "Nadchodzący", tone: "upcoming" };
    }
    return { text: "Turniej", tone: "neutral" };
  }, [t?.eventStartAt, t?.eventEndAt]);

  // status zapisów + “inteligentny” opis
  const regInfo = useMemo(() => {
    const now = new Date();

    const start = t?.regStartAt ? new Date(t.regStartAt) : null;
    const end = t?.regEndAt ? new Date(t.regEndAt) : null;

    const hasStart = start && !Number.isNaN(start.getTime());
    const hasEnd = end && !Number.isNaN(end.getTime());

    const notStarted = hasStart && now < start;
    const closed = hasEnd && now > end;
    const open = (!hasStart || now >= start) && (!hasEnd || now <= end);

    const rangeText =
      hasStart || hasEnd
        ? `${hasStart ? prettyDateTime(start) : "—"} → ${hasEnd ? prettyDateTime(end) : "—"}`
        : "Brak ustawionych dat zapisów";

    let badge = { text: "Zapisy: otwarte", tone: "open" };
    if (notStarted) badge = { text: "Zapisy: jeszcze nie", tone: "soon" };
    if (closed) badge = { text: "Zapisy: zamknięte", tone: "closed" };
    if (!hasStart && !hasEnd) badge = { text: "Zapisy: brak dat", tone: "neutral" };

    let smart = "";
    if (notStarted && hasStart) {
      const d = diffHuman(start);
      if (d) smart = `Start zapisów za ${d.days}d ${d.hours}h`;
    } else if (open && hasEnd) {
      const d = diffHuman(end);
      if (d) smart = `Koniec zapisów za ${d.days}d ${d.hours}h`;
    } else if (closed && hasEnd) {
      const d = diffHuman(end);
      if (d) smart = `Zamknięto ${d.days}d ${d.hours}h temu`;
    } else if (!hasStart && !hasEnd) {
      smart = "Ustaw daty zapisów w panelu admina";
    }

    return {
      start: hasStart ? start : null,
      end: hasEnd ? end : null,
      open,
      notStarted,
      closed,
      rangeText,
      badge,
      smart,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t?.regStartAt, t?.regEndAt]);

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

    // front guard: jak zapisy nieaktywne, nie strzelamy requestem
    if (!regInfo.open) {
      if (regInfo.notStarted) {
        setActionErr("Zapisy jeszcze się nie rozpoczęły.");
        return;
      }
      if (regInfo.closed) {
        setActionErr("Zapisy zostały zakończone — nie można już dołączyć.");
        return;
      }
      setActionErr("Zapisy są aktualnie niedostępne.");
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

      if (code === "REGISTRATION_NOT_STARTED") {
        setActionErr("Zapisy jeszcze się nie rozpoczęły.");
        return;
      }
      if (code === "REGISTRATION_CLOSED") {
        setActionErr("Zapisy zostały zakończone — nie można już dołączyć.");
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
    } catch { }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const showNotApprovedActions =
    actionErr && actionErr.toLowerCase().includes("nie jest zaakceptowana");

  const metaText = useMemo(() => {
    const city = t?.city || "—";
    const venue = t?.venue ? ` • ${t.venue}` : "";
    return `${city}${venue}`;
  }, [t?.city, t?.venue]);

  return (
    <section className={styles.section}>
      <div className={styles.bgGlow} aria-hidden="true" />
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
                    cancelRedirect();
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
                    cancelRedirect();
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
            {/* HERO / HEADER */}
            <div className={styles.hero}>
              {t.bannerUrl ? (
                <div className={styles.heroBg} style={{ backgroundImage: `url("${t.bannerUrl}")` }} aria-hidden="true" />
              ) : (
                <div className={styles.heroBgFallback} aria-hidden="true" />
              )}
              <div className={styles.heroOverlay} aria-hidden="true" />

              <div className={styles.heroInner}>
                <div className={styles.heroIcon}>
                  <FaTrophy />
                </div>

                <div className={styles.heroHead}>
                  <h1 className={styles.detailsTitle}>{t.title}</h1>

                  <div className={styles.detailsMetaRow} title={metaText}>
                    {/* Termin turnieju */}
                    <span className={styles.pillSoft}>
                      <FaCalendarAlt /> {dateRangeEvent}
                    </span>

                    {/* Status turnieju */}
                    <span className={`${styles.statusPill} ${styles[`status_${tournamentStatus.tone}`]}`}>
                      <span className={styles.dot} aria-hidden="true" />
                      {tournamentStatus.text}
                    </span>

                    {/* Zapisy: status */}
                    <span className={`${styles.regPill} ${styles[`reg_${regInfo.badge.tone}`]}`}>
                      <FaClock />
                      {regInfo.badge.text}
                    </span>

                    {/* Zapisy: zakres */}
                    <span className={styles.pillSoft}>
                      <FaClock /> {regInfo.rangeText}
                    </span>

                    {/* Lokalizacja */}
                    <span className={styles.pillSoft}>
                      <FaMapMarkerAlt /> {t.city || "—"}
                    </span>

                    {!!t.venue && (
                      <span className={styles.pillSoft}>
                        <FaMapPin /> {t.venue}
                      </span>
                    )}
                  </div>

                  {!!regInfo.smart && <div className={styles.heroHint}>{regInfo.smart}</div>}
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

            {/* HARMONOGRAM */}
            <div className={styles.block}>
              <div className={styles.blockHead}>
                <h2>Harmonogram</h2>
                <span className={styles.blockBadge}>Terminy</span>
              </div>

              <div className={styles.scheduleGrid}>
                <div className={styles.scheduleCard}>
                  <div className={styles.scheduleTop}>
                    <span className={styles.scheduleLabel}>Start zapisów</span>
                    <span className={styles.scheduleTone}>
                      <FaClock /> {t?.regStartAt ? prettyDateTime(t.regStartAt) : "—"}
                    </span>
                  </div>
                  <div className={styles.scheduleHint}>Od tego momentu można wysyłać zgłoszenia.</div>
                </div>

                <div className={styles.scheduleCard}>
                  <div className={styles.scheduleTop}>
                    <span className={styles.scheduleLabel}>Koniec zapisów</span>
                    <span className={styles.scheduleTone}>
                      <FaClock /> {t?.regEndAt ? prettyDateTime(t.regEndAt) : "—"}
                    </span>
                  </div>
                  <div className={styles.scheduleHint}>Po tym terminie zgłoszenia są zamknięte.</div>
                </div>

                <div className={styles.scheduleCard}>
                  <div className={styles.scheduleTop}>
                    <span className={styles.scheduleLabel}>Start turnieju</span>
                    <span className={styles.scheduleTone}>
                      <FaCalendarAlt /> {t?.eventStartAt ? prettyDateTime(t.eventStartAt) : "—"}
                    </span>
                  </div>
                  <div className={styles.scheduleHint}>Początek rywalizacji (data i godzina).</div>
                </div>

                {t?.eventEndAt ? (
                  <div className={styles.scheduleCard}>
                    <div className={styles.scheduleTop}>
                      <span className={styles.scheduleLabel}>Koniec turnieju</span>
                      <span className={styles.scheduleTone}>
                        <FaCalendarAlt /> {prettyDateTime(t.eventEndAt)}
                      </span>
                    </div>
                    <div className={styles.scheduleHint}>Zakończenie wydarzenia (data i godzina).</div>
                  </div>
                ) : null}
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
                <div className={`${styles.msgInline} ${styles.errInline}`}>
                  ❌ {String(actionErr).replace(/^(\s*❌\s*)+/, "")}
                </div>
              )}

              {!regInfo.open && (
                <div className={`${styles.msgInline} ${styles.warnInline}`}>
                  <span className={styles.warnIcon} aria-hidden="true">⏳</span>
                  {regInfo.notStarted
                    ? "Zapisy jeszcze się nie rozpoczęły."
                    : regInfo.closed
                      ? "Zapisy zostały zakończone."
                      : "Zapisy są aktualnie niedostępne."}
                  {!!regInfo.smart && <span className={styles.warnSmall}> • {regInfo.smart}</span>}
                </div>
              )}

              <div className={styles.registerRow}>
                <button
                  className={styles.btnPrimary}
                  onClick={handleRegister}
                  disabled={actionLoading || isFull || !regInfo.open}
                  type="button"
                  title={
                    isFull
                      ? "Limit osiągnięty"
                      : !regInfo.open
                        ? regInfo.notStarted
                          ? "Zapisy jeszcze się nie rozpoczęły"
                          : "Zapisy są zamknięte"
                        : "Zgłoś swoją drużynę"
                  }
                >
                  {isFull
                    ? "Limit osiągnięty"
                    : actionLoading
                      ? "Zapisywanie..."
                      : !regInfo.open
                        ? regInfo.notStarted
                          ? "Zapisy jeszcze nie wystartowały"
                          : "Zapisy zamknięte"
                        : "Zgłoś drużynę"}
                </button>

                <div className={styles.registerHint}>
                  {isFull ? (
                    <span className={styles.hintText}>Turniej jest pełny — limit osiągnięty.</span>
                  ) : !regInfo.open ? (
                    <span className={styles.hintText}>
                      {regInfo.notStarted ? "Poczekaj na start zapisów." : "Zapisy są zamknięte."}
                    </span>
                  ) : (
                    <span className={styles.hintText}>Kliknij, aby wysłać zgłoszenie swojej drużyny do turnieju.</span>
                  )}
                </div>
              </div>

              {showNotApprovedActions && (
                <div className={styles.inlineActions}>
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
