const fs = require('fs');
const filePath = 'src/main.jsx';
let content = fs.readFileSync(filePath, 'utf8');
let changed = 0;

// 1) State ve fonksiyonlar - manualBdValue state'inin hemen altina ekle
const stateTarget = `const [manualBdValue, setManualBdValue] = useState(3.30);`;
const stateReplacement = `const [manualBdValue, setManualBdValue] = useState(3.30);
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ozerbend_favorites");
      if (raw) setFavorites(JSON.parse(raw));
    } catch (e) {}
  }, []);

  const persistFavorites = (list) => {
    setFavorites(list);
    try {
      localStorage.setItem("ozerbend_favorites", JSON.stringify(list));
    } catch (e) {}
  };

  const saveFavorite = () => {
    const name = window.prompt(t.favNamePrompt || "Favori adi:");
    if (!name) return;
    const fav = {
      id: Date.now(),
      name,
      profileType, A, B, C, D, EN, H,
      segments: isGeneral ? segments : undefined,
      material, thickness, bendAngle, insideR, deduct, manualBd, manualBdValue,
    };
    persistFavorites([fav, ...favorites]);
  };

  const applyFavorite = (fav) => {
    setProfileType(fav.profileType);
    setA(fav.A); setB(fav.B); setC(fav.C); setD(fav.D); setEN(fav.EN); setH(fav.H);
    if (fav.segments) setSegments(fav.segments);
    setMaterial(fav.material); setThickness(fav.thickness);
    setBendAngle(fav.bendAngle); setInsideR(fav.insideR);
    setDeduct(fav.deduct); setManualBd(fav.manualBd); setManualBdValue(fav.manualBdValue);
    setShowFavorites(false);
  };

  const deleteFavorite = (id) => {
    persistFavorites(favorites.filter((f) => f.id !== id));
  };`;

if (content.includes(stateTarget)) {
  content = content.replace(stateTarget, stateReplacement);
  changed++;
} else {
  console.error('UYARI: state hedefi bulunamadi.');
}

// 2) UI - Olculer basligina Favoriler butonlarini ekle
const uiTarget = `<h2>{t.dims}</h2>`;
const uiReplacement = `<div className="dimsHeaderRow">
        <h2>{t.dims}</h2>
        <div className="favWrap">
          <button type="button" className="favBtn" onClick={() => setShowFavorites(!showFavorites)}>⭐ {t.favorites}</button>
          <button type="button" className="favBtn" onClick={saveFavorite}>💾 {t.favSave}</button>
        </div>
      </div>
      {showFavorites && (
        <div className="favPanel">
          {favorites.length === 0 ? (
            <p className="favEmpty">{t.favEmpty}</p>
          ) : (
            favorites.map((fav) => (
              <div className="favRow" key={fav.id}>
                <span>{fav.name}</span>
                <div>
                  <button type="button" onClick={() => applyFavorite(fav)}>{t.favLoad}</button>
                  <button type="button" onClick={() => deleteFavorite(fav.id)}>{t.favDelete}</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}`;

if (content.includes(uiTarget)) {
  content = content.replace(uiTarget, uiReplacement);
  changed++;
} else {
  console.error('UYARI: UI hedefi bulunamadi.');
}

// 3) Ceviriler - her dil bloguna favori metinlerini ekle
const translations = [
  {
    anchor: `segmentSil: "Kaldır",`,
    add: `
    favorites: "Favoriler",
    favSave: "Kaydet",
    favLoad: "Yükle",
    favDelete: "Sil",
    favEmpty: "Kayıtlı favori yok.",
    favNamePrompt: "Favori adı:",`
  },
  {
    anchor: `segmentSil: "Remove",`,
    add: `
    favorites: "Favorites",
    favSave: "Save",
    favLoad: "Load",
    favDelete: "Delete",
    favEmpty: "No favorites saved.",
    favNamePrompt: "Favorite name:",`
  },
  {
    anchor: `segmentSil: "Retirer",`,
    add: `
    favorites: "Favoris",
    favSave: "Enregistrer",
    favLoad: "Charger",
    favDelete: "Supprimer",
    favEmpty: "Aucun favori enregistré.",
    favNamePrompt: "Nom du favori :",`
  },
  {
    anchor: `segmentSil: "Entfernen",`,
    add: `
    favorites: "Favoriten",
    favSave: "Speichern",
    favLoad: "Laden",
    favDelete: "Löschen",
    favEmpty: "Keine Favoriten gespeichert.",
    favNamePrompt: "Favoritenname:",`
  },
];

translations.forEach((tr, idx) => {
  if (content.includes(tr.anchor)) {
    content = content.replace(tr.anchor, tr.anchor + tr.add);
    changed++;
  } else {
    console.error(`UYARI: ceviri ${idx} bulunamadi (${tr.anchor}).`);
  }
});

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Tamamlandi. ${changed}/6 blok degistirildi.`);
