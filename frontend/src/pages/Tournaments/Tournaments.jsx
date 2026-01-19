// Tournaments.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Tournaments.module.scss";
import {
  FaTrophy,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaArrowRight,
  FaRegMoneyBillAlt,
  FaUsers,
  FaClock,
} from "react-icons/fa";

import { apiFetch } from "../../api/api"; // <- dopasuj ścieżkę jeśli masz inaczej

export default function Tournaments() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("Ładowanie...");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        setMsg("Ładowanie...");
        const data = await apiFetch("/api/tournaments"); // ✅ już nie localhost
        setItems(Array.isArray(data) ? data : []);
        setMsg("");
      } catch (e) {
        setMsg(`❌ ${e.message}`);
      }
    })();
  }, []);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => new Date(a.eventStartAt) - new Date(b.eventStartAt));
  }, [items]);

  const prettyDate = (d) => {
    try {
      return new Date(d).toLocaleDateString("pl-PL");
    } catch {
      return "—";
    }
  };

  const prettyTime = (d) => {
    try {
      return new Date(d).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const eventRange = (t) => {
    const s = t?.eventStartAt ? new Date(t.eventStartAt) : null;
    const e = t?.eventEndAt ? new Date(t.eventEndAt) : null;

    if (!s) return "—";

    const sameDay = e ? s.toDateString() === e.toDateString() : true;

    const sDate = prettyDate(s);
    const sTime = prettyTime(s);

    if (!e) return sTime ? `${sDate} • ${sTime}` : sDate;

    const eDate = prettyDate(e);
    const eTime = prettyTime(e);

    if (sameDay) {
      if (sTime && eTime) return `${sDate} • ${sTime}–${eTime}`;
      return sDate;
    }

    const left = sTime ? `${sDate} ${sTime}` : sDate;
    const right = eTime ? `${eDate} ${eTime}` : eDate;
    return `${left} – ${right}`;
  };

  const regStatusFor = (t) => {
    const now = new Date();

    const rs = t?.regStartAt ? new Date(t.regStartAt) : null;
    const re = t?.regEndAt ? new Date(t.regEndAt) : null;

    const rsOk = rs && !Number.isNaN(rs.getTime());
    const reOk = re && !Number.isNaN(re.getTime());

    if (reOk && now > re) return { text: "Zapisy zakończone", tone: "done" };
    if (!rsOk && reOk && now <= re) return { text: "Zapisy trwają", tone: "live" };

    if (rsOk && now < rs) {
      const diffDays = Math.ceil((rs - now) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) return { text: "Zapisy już wkrótce", tone: "soon" };
      return { text: "Zapisy nieaktywne", tone: "upcoming" };
    }

    if (rsOk && (!reOk || now <= re)) return { text: "Zapisy trwają", tone: "live" };

    return { text: "Brak okna zapisów", tone: "neutral" };
  };

  const tournamentStatusFor = (t) => {
    const now = new Date();
    const s = t?.eventStartAt ? new Date(t.eventStartAt) : null;
    const e = t?.eventEndAt ? new Date(t.eventEndAt) : null;

    const sOk = s && !Number.isNaN(s.getTime());
    const eOk = e && !Number.isNaN(e.getTime());

    if (eOk && now > e) return { text: "Zakończony", tone: "done" };
    if (sOk && now >= s && (!eOk || now <= e)) return { text: "Trwa", tone: "live" };
    if (sOk) return { text: "Nadchodzący", tone: "upcoming" };
    return { text: "Turniej", tone: "neutral" };
  };

  const metaText = (t) => {
    const city = t.city || "—";
    const venue = t.venue ? ` • ${t.venue}` : "";
    return `${city}${venue}`;
  };

  return (
    <section className={styles.section}>
      <div className={styles.bgGlow} aria-hidden="true" />

      <div className={styles.header}>
        <h1>
          Turnieje <span>SPIKEZONE</span>
        </h1>
        <p className={styles.sub}>Kliknij turniej, aby zobaczyć szczegóły i informacje organizacyjne.</p>
      </div>

      <div className={styles.container}>
        {msg && <div className={styles.msg}>{msg}</div>}

        {!msg && sorted.length === 0 && <div className={styles.msg}>Brak opublikowanych turniejów.</div>}

        <div className={styles.grid}>
          {sorted.map((t) => {
            const eventText = eventRange(t);
            const reg = regStatusFor(t);
            const ts = tournamentStatusFor(t);

            return (
              <button
                key={t._id}
                className={styles.card}
                onClick={() => navigate(`/tournaments/${t.slug}`)}
                type="button"
                aria-label={`Otwórz turniej ${t.title}`}
              >
                <div className={styles.media}>
                  {t.bannerUrl ? (
                    <img
                      className={styles.banner}
                      src={t.bannerUrl}
                      alt={`Banner turnieju ${t.title}`}
                      loading="lazy"
                      draggable="false"
                    />
                  ) : (
                    <div className={styles.bannerFallback} />
                  )}

                  <div className={styles.mediaOverlay} />

                  <div className={styles.logoWrap}>
                    <div className={styles.logoFallback}>
                      <FaTrophy />
                    </div>
                  </div>

                  <div className={styles.cornerPills}>
                    <span className={styles.pillSoft}>
                      <FaCalendarAlt /> {eventText}
                    </span>

                    <span className={`${styles.regPill} ${styles[`reg_${reg.tone}`]}`}>
                      <FaClock /> {reg.text}
                    </span>
                  </div>
                </div>

                <div className={styles.top}>
                  <div className={styles.icon}>
                    <FaTrophy />
                  </div>

                  <div className={styles.pillsRow}>
                    <div className={`${styles.statusPill} ${styles[`status_${ts.tone}`]}`}>
                      <span className={styles.dot} aria-hidden="true" />
                      {ts.text}
                    </div>
                  </div>
                </div>

                <div className={styles.title} title={t.title}>
                  {t.title}
                </div>

                <div className={styles.meta} title={metaText(t)}>
                  <span className={styles.metaItem}>
                    <FaMapMarkerAlt />
                    {t.city || "—"}
                  </span>

                  {!!t.venue && <span className={styles.metaSep}>•</span>}
                  {!!t.venue && <span className={styles.venue}>{t.venue}</span>}
                </div>

                <div className={styles.statsRow}>
                  <span className={styles.statPill}>
                    <FaUsers /> Limit drużyn: {t.teamLimit ?? 16}
                  </span>

                  <span className={styles.statPill}>
                    <FaRegMoneyBillAlt /> Wpisowe od drużyny: {t.entryFee ?? 0} zł
                  </span>
                </div>

                <div className={styles.footer}>
                  <span className={styles.open}>
                    Zobacz szczegóły turnieju <FaArrowRight />
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
