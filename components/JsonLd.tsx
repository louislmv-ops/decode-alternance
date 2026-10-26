/** Données structurées schema.org, lues par Google et par les moteurs des assistants IA. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // « < » échappé : le JSON ne peut pas fermer la balise script.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
