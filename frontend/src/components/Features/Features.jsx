import styles from './Features.module.scss';
import { FaTrophy, FaUsers, FaClipboardCheck, FaChartLine } from 'react-icons/fa';

const data = [
  {
    title: 'Turnieje',
    desc: 'Przeglądaj aktualne i nadchodzące edycje.',
    icon: <FaTrophy />,
    meta: 'Kalendarz + szczegóły',
  },
  {
    title: 'Drużyny',
    desc: 'Poznaj zespoły, składy i profile graczy.',
    icon: <FaUsers />,
    meta: 'Profile + składy',
  },
  {
    title: 'Zapisy',
    desc: 'Szybka rejestracja online i kontrola miejsc.',
    icon: <FaClipboardCheck />,
    meta: 'Bez formularzy na mailu',
  },
  {
    title: 'Społeczność',
    desc: 'Rankingi, statystyki i historia turniejów.',
    icon: <FaChartLine />,
    meta: 'Ranking + staty',
  },
];

const Features = () => {
  return (
    <section className={styles.section} id="features">
      <div className={styles.header}>
        <h2>
          Co oferuje <span>SPIKEZONE</span>?
        </h2>
        <p className={styles.sub}>
          Wszystko w jednym miejscu – od zapisów po rankingi. Prosto, szybko i nowocześnie.
        </p>
      </div>

      <div className={styles.grid}>
        {data.map((el, i) => (
          <div key={i} className={styles.card}>
            <div className={styles.top}>
              <div className={styles.icon}>{el.icon}</div>
              <div className={styles.badge}>{el.meta}</div>
            </div>

            <h3>{el.title}</h3>
            <p>{el.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
