import styles from './Footer.module.scss';
import { FaInstagram, FaFacebookF, FaYoutube, FaTiktok, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* BRAND */}
        <div className={styles.brand}>
          <h3 className={styles.logo}>SPIKEZONE</h3>
          <p className={styles.tagline}>
            Nowoczesna platforma turniejów siatkarskich — zapisy, terminarze, drużyny i statystyki w jednym miejscu.
          </p>

          <div className={styles.badges}>
            <span className={styles.badge}>Turnieje</span>
            <span className={styles.badge}>Drużyny</span>
            <span className={styles.badge}>Rankingi</span>
          </div>
        </div>

        {/* LINKS */}
        <div className={styles.col}>
          <h4>Serwis</h4>
          <ul>
            <li><a href="/">Strona główna</a></li>
            <li><a href="/turnieje">Turnieje</a></li>
            <li><a href="/druzyny">Drużyny</a></li>
            <li><a href="/o-nas">O nas</a></li>
          </ul>
        </div>

        {/* SUPPORT */}
        <div className={styles.col}>
          <h4>Wsparcie</h4>
          <ul>
            <li><a href="/kontakt">Kontakt</a></li>
            <li><a href="/faq">FAQ</a></li>
            <li><a href="/regulamin">Regulamin</a></li>
            <li><a href="/polityka-prywatnosci">Prywatność</a></li>
          </ul>
        </div>

        {/* CONTACT + SOCIAL */}
        <div className={styles.col}>
          <h4>Kontakt</h4>

          <div className={styles.contactItem}>
            <FaEnvelope />
            <a href="mailto:kontakt@spikezone.pl">kontakt@spikezone.pl</a>
          </div>

          <div className={styles.contactItem}>
            <FaMapMarkerAlt />
            <span>Polska • Turnieje siatkarskie</span>
          </div>

          <div className={styles.socials}>
            <a className={styles.social} href="#" aria-label="Instagram"><FaInstagram /></a>
            <a className={styles.social} href="#" aria-label="Facebook"><FaFacebookF /></a>
            <a className={styles.social} href="#" aria-label="YouTube"><FaYoutube /></a>
            <a className={styles.social} href="#" aria-label="TikTok"><FaTiktok /></a>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© {year} SPIKEZONE. Wszelkie prawa zastrzeżone.</span>
        <span className={styles.madeBy}>
          Made with <span className={styles.dot} /> by SpikeZone
        </span>
      </div>
    </footer>
  );
};

export default Footer;
