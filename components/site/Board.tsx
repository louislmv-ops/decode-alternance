// Gros plans sur l'interface : chaque tuile agrandit un vrai morceau de l'appli.

export function Board() {
  return (
    <section className="board section" aria-labelledby="board-title">
      <div className="board__grid">
        <div className="tile tile--head" data-reveal>
          <h2 id="board-title" className="section-title">
            Pensé pour l’alternance
          </h2>
        </div>

        <div className="tile tile--pepite" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
          <div className="tile__zoom tile__zoom--pepite" data-ui aria-hidden="true">
            <span className="pepite stroke">Grande entreprise</span>
            <span className="pepite stroke">+50 % au-dessus du minimum</span>
          </div>
          <div className="tile__caption">
            <h3>Les pépites, surlignées</h3>
            <p>Grande entreprise ou salaire au moins 20 % au-dessus de ton minimum légal.</p>
          </div>
        </div>

        <div className="tile tile--rythme" data-reveal style={{ '--i': 2 } as React.CSSProperties}>
          <div className="tile__zoom tile__zoom--week" data-ui aria-hidden="true">
            <span className="is-company">L</span>
            <span className="is-company">M</span>
            <span className="is-company">M</span>
            <span className="is-school">J</span>
            <span className="is-school">V</span>
          </div>
          <div className="tile__caption">
            <h3>Ton rythme vérifié</h3>
            <p>Celui de l’offre face à celui de ton école.</p>
          </div>
        </div>

        <div className="tile tile--chrono" data-reveal style={{ '--i': 3 } as React.CSSProperties}>
          <div className="tile__zoom tile__zoom--chrono num" data-ui aria-hidden="true">
            J-41
          </div>
          <div className="tile__caption">
            <h3>Le chrono des 3 mois</h3>
            <p>Inscrit en CFA sans employeur ? Ton plan suit la date limite.</p>
          </div>
        </div>

        <div className="tile tile--piege" data-reveal style={{ '--i': 4 } as React.CSSProperties}>
          <div className="tile__zoom tile__zoom--alert" data-ui aria-hidden="true">
            <span>Offre d’école ?</span>
          </div>
          <div className="tile__caption">
            <h3>Les fausses offres signalées</h3>
            <p>Frais, « entreprises partenaires », rentrée au lieu d’embauche.</p>
          </div>
        </div>

        <div className="tile tile--figure" data-reveal style={{ '--i': 5 } as React.CSSProperties}>
          <div className="tile__zoom tile__zoom--figure num" data-ui aria-hidden="true">
            989,52 €
          </div>
          <div className="tile__caption">
            <h3>Ton minimum, au centime</h3>
            <p>53 % du SMIC à 21 ans, en première année.</p>
          </div>
        </div>

        <div className="tile tile--query" data-reveal style={{ '--i': 6 } as React.CSSProperties}>
          <div className="tile__zoom tile__zoom--query" data-ui aria-hidden="true">
            <span>« Orvane » insights alternant</span>
          </div>
          <div className="tile__caption">
            <h3>Les bonnes recherches LinkedIn</h3>
            <p>Le service, les postes à chercher et le message.</p>
          </div>
        </div>

        <div className="tile tile--relance" data-reveal style={{ '--i': 7 } as React.CSSProperties}>
          <div className="tile__zoom tile__zoom--toggle" data-ui aria-hidden="true">
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
            Relance J+7
          </div>
          <div className="tile__caption">
            <h3>Une relance, au bon moment</h3>
            <p>Ton suivi te le rappelle.</p>
          </div>
        </div>

        <div className="tile tile--certitude" data-reveal style={{ '--i': 8 } as React.CSSProperties}>
          <div className="tile__zoom tile__zoom--chips" data-ui aria-hidden="true">
            <span className="ui-chip ui-chip--dit">Dit</span>
            <span className="ui-chip ui-chip--deduit">Déduit</span>
            <span className="ui-chip ui-chip--inconnu">Inconnu</span>
          </div>
          <div className="tile__caption">
            <h3>Zéro invention</h3>
            <p>Chaque info dit d’où elle vient.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
