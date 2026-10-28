// « Où tu vas bosser » : une petite carte OpenStreetMap du lieu de l'offre, et le lien pour l'itinéraire.
// Quand l'annonce ne donne que la ville, la carte montre le centre de la ville et le dit.

export interface OfferPlace {
  lat: number;
  lon: number;
  precision: 'adresse' | 'ville';
  /** La ville ou l'adresse affichée sous la carte. */
  label: string | null;
}

export function OfferMap({ place }: { place: OfferPlace }) {
  const { lat, lon } = place;
  // Un quartier pour une adresse, la ville entière sinon.
  const d = place.precision === 'adresse' ? 0.006 : 0.03;
  const bbox = [lon - d * 1.6, lat - d, lon + d * 1.6, lat + d].map((n) => n.toFixed(5)).join(',');
  const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(5)},${lon.toFixed(5)}`;
  const route = `https://www.google.com/maps/dir/?api=1&destination=${lat.toFixed(5)},${lon.toFixed(5)}`;
  return (
    <section className="panel omap" aria-labelledby="omap-title">
      <div className="panel__head">
        <h2 id="omap-title">Où tu vas bosser</h2>
      </div>
      <iframe className="omap__frame" src={embed} title={`Carte : ${place.label ?? 'lieu de l’offre'}`} loading="lazy" referrerPolicy="no-referrer" />
      <p className="omap__note">
        {place.precision === 'adresse'
          ? `📍 ${place.label ?? 'Adresse donnée par l’annonce'}`
          : `📍 Centre de ${place.label ?? 'la ville'} : l’annonce ne donne pas l’adresse exacte, demande-la avant l’entretien.`}{' '}
        <a href={route} target="_blank" rel="noopener noreferrer" className="link">
          Calculer mon trajet
        </a>
      </p>
      <p className="omap__credit">
        Carte ©{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
          OpenStreetMap
        </a>
      </p>
    </section>
  );
}
