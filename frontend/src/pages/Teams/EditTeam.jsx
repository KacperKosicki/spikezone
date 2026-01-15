import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./EditTeam.module.scss";
import { apiFetch, apiUpload } from "../../api/api";

const FLASH_KEY = "teamFlash";

const hardGoTeamMe = (flash) => {
  try {
    if (flash) sessionStorage.setItem(FLASH_KEY, flash);
  } catch {}
  window.location.replace("/team/me");
};

const normalizeMembers = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((m) => String(m?.fullName || "").trim())
    .filter(Boolean);

export default function EditTeam() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);

  const [description, setDescription] = useState("");
  const [members, setMembers] = useState([{ fullName: "" }]);

  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // ✅ snapshot początkowych danych (żeby wykryć realne zmiany)
  const initialDescRef = useRef("");
  const initialMembersRef = useRef([]);

  const logoPreview = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : ""), [logoFile]);
  const bannerPreview = useMemo(() => (bannerFile ? URL.createObjectURL(bannerFile) : ""), [bannerFile]);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [logoPreview, bannerPreview]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setMsg("");

        const data = await apiFetch("/api/team/me");
        if (!data) {
          navigate("/team/create", { replace: true });
          return;
        }

        setTeam(data);

        const desc = data.description || "";
        const mems = Array.isArray(data.members) && data.members.length
          ? data.members.map((m) => ({ fullName: m.fullName || "" }))
          : [{ fullName: "" }];

        setDescription(desc);
        setMembers(mems);

        setLogoUrl(data.logoUrl || "");
        setBannerUrl(data.bannerUrl || "");

        // snapshot do porównania
        initialDescRef.current = String(desc || "").trim();
        initialMembersRef.current = normalizeMembers(data.members);
      } catch (e) {
        setMsg(`❌ ${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const isPending = team?.status === "pending";
  const lockTextFields = isPending; // pending blokuje opis/skład

  const updateMember = (idx, value) => {
    setMembers((prev) => prev.map((m, i) => (i === idx ? { fullName: value } : m)));
  };

  const addMember = () => {
    if (lockTextFields) return;
    setMembers((prev) => (prev.length >= 10 ? prev : [...prev, { fullName: "" }]));
  };

  const removeMember = (idx) => {
    if (lockTextFields) return;
    setMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const validateMembers = () => {
    const normalized = normalizeMembers(members);

    if (normalized.length === 0) return { ok: false, message: "❌ Dodaj przynajmniej jednego zawodnika" };
    if (normalized.length > 10) return { ok: false, message: "❌ Maksymalnie 10 zawodników" };

    const invalidIdx = normalized.findIndex((v) => v.length < 3);
    if (invalidIdx !== -1) return { ok: false, message: `❌ Zawodnik #${invalidIdx + 1} min. 3 znaki` };

    return { ok: true, members: normalized.map((fullName) => ({ fullName })) };
  };

  const uploadImage = async (kind, file) => {
    const form = new FormData();
    form.append(kind, file);
    return await apiUpload(`/api/team/upload/${kind}`, form);
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (saving) return;

    setMsg("");

    const didUploadLogo = !!logoFile;
    const didUploadBanner = !!bannerFile;

    // ✅ wykryj czy teksty faktycznie się zmieniły
    const nextDescTrim = String(description || "").trim();
    const nextMembersNorm = normalizeMembers(members);

    const didTextChange =
      !lockTextFields && (
        nextDescTrim !== initialDescRef.current ||
        JSON.stringify(nextMembersNorm) !== JSON.stringify(initialMembersRef.current)
      );

    // jeśli pending i ktoś nic nie wybrał do uploadu -> nie rób nic
    if (lockTextFields && !didUploadLogo && !didUploadBanner) {
      setMsg("❌ Drużyna jest w trakcie rozpatrywania – możesz zmienić tylko logo i banner");
      return;
    }

    try {
      setSaving(true);

      // ✅ 1) NAJPIERW teksty (bo PATCH ustawia pending)
      // Dzięki temu nie trafisz w 403 po uploadzie.
      if (didTextChange) {
        const membersRes = validateMembers();
        if (!membersRes.ok) throw new Error(membersRes.message);

        await apiFetch("/api/team/me", {
          method: "PATCH",
          body: {
            description: nextDescTrim,
            members: membersRes.members,
          },
        });
      }

      // ✅ 2) POTEM uploady (upload też ustawia pending, ale to już nie szkodzi)
      if (didUploadLogo) await uploadImage("logo", logoFile);
      if (didUploadBanner) await uploadImage("banner", bannerFile);

      // ✅ 3) redirect zawsze
      const didAnyUpload = didUploadLogo || didUploadBanner;
      const didAnyChange = didTextChange || didAnyUpload;

      if (!didAnyChange) {
        hardGoTeamMe("ℹ️ Brak zmian do zapisania.");
        return;
      }

      hardGoTeamMe("✅ Zapisano zmiany. Drużyna została wysłana do weryfikacji (status: ROZPATRYWANIE).");
    } catch (err) {
      setMsg(`❌ ${err.message}`);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.page}>
        <div className={styles.container}>
          <button className={styles.back} onClick={() => navigate("/team/me")}>
            ← Wróć
          </button>
          <div className={styles.msg}>Ładowanie...</div>
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
          <div className={styles.msg}>Nie masz drużyny.</div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <button className={styles.back} onClick={() => navigate("/team/me")}>
          ← Wróć
        </button>

        <h1 className={styles.h1}>Edytuj drużynę</h1>
        <p className={styles.sub}>
          {lockTextFields
            ? "Drużyna jest w trakcie rozpatrywania. Możesz zmienić tylko logo/banner."
            : "Możesz edytować dane i grafiki. Po zapisie drużyna wraca do moderacji."}
        </p>

        {msg && <div className={styles.msg}>{msg}</div>}

        <form className={styles.form} onSubmit={onSave}>
          <div className={styles.grid}>
            <div className={styles.field}>
              <span>Nazwa</span>
              <input value={team.name} disabled />
            </div>

            <label className={styles.field}>
              <span>Logo</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                disabled={saving}
              />
              {(logoPreview || logoUrl) && (
                <img className={styles.preview} src={logoPreview || logoUrl} alt="logo" />
              )}
            </label>

            <label className={styles.field}>
              <span>Banner</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                disabled={saving}
              />
              {(bannerPreview || bannerUrl) && (
                <img className={styles.previewBanner} src={bannerPreview || bannerUrl} alt="banner" />
              )}
            </label>

            <label className={`${styles.field} ${styles.full}`}>
              <span>Opis</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                maxLength={2000}
                disabled={saving || lockTextFields}
              />
              {lockTextFields && (
                <small className={styles.hint}>
                  Edycja opisu zablokowana w trakcie rozpatrywania.
                </small>
              )}
            </label>
          </div>

          <div className={styles.section}>
            <h2>Skład</h2>

            <div className={styles.members}>
              {members.map((m, idx) => (
                <div className={styles.memberRow} key={idx}>
                  <input
                    className={styles.memberInput}
                    placeholder="Imię i nazwisko"
                    value={m.fullName}
                    onChange={(e) => updateMember(idx, e.target.value)}
                    maxLength={60}
                    disabled={saving || lockTextFields}
                  />
                  {members.length > 1 && (
                    <button
                      type="button"
                      className={styles.memberRemove}
                      onClick={() => removeMember(idx)}
                      disabled={saving || lockTextFields}
                    >
                      Usuń
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              className={styles.addMember}
              onClick={addMember}
              disabled={saving || lockTextFields || members.length >= 10}
            >
              + Dodaj zawodnika
            </button>
          </div>

          <div className={styles.actions}>
            <button className={styles.btnPrimary} disabled={saving}>
              {saving ? "Zapisywanie..." : "Zapisz"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
