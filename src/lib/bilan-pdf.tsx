import path from "node:path";
import { Document, Font, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Bilan } from "@/lib/bilan";

// Le bilan en PDF : ivoire et Lora, comme le transcript et les notes d'Émilien.
const fichier = (nom: string) => path.join(process.cwd(), "node_modules/@fontsource/lora/files", nom);
Font.register({
  family: "Lora",
  fonts: [
    { src: fichier("lora-latin-400-normal.woff") },
    { src: fichier("lora-latin-400-italic.woff"), fontStyle: "italic" },
    { src: fichier("lora-latin-600-normal.woff"), fontWeight: 600 },
  ],
});
Font.registerHyphenationCallback((mot) => [mot]);

const VIOLET = "#59114D";
const ROUGE = "#E6361D";
const s = StyleSheet.create({
  page: { backgroundColor: "#FAF6EF", color: "#111111", fontFamily: "Lora", fontSize: 11, lineHeight: 1.6, paddingTop: 64, paddingBottom: 64, paddingHorizontal: 70 },
  marque: { fontSize: 9, fontStyle: "italic", color: VIOLET, marginBottom: 26 },
  periode: { fontSize: 11, fontStyle: "italic", color: VIOLET },
  titre: { fontSize: 28, fontWeight: 600, lineHeight: 1.1, color: VIOLET, marginTop: 4 },
  mots: { fontSize: 12, color: ROUGE, marginTop: 10, marginBottom: 26 },
  section: { fontSize: 14, fontWeight: 600, color: VIOLET, marginTop: 22, marginBottom: 8 },
  ligne: { marginBottom: 6 },
  parole: { marginBottom: 10, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: "#F7BECA" },
  date: { fontSize: 9, fontStyle: "italic", color: VIOLET },
  numero: { position: "absolute", bottom: 32, left: 0, right: 0, textAlign: "center", fontSize: 8.5 },
});

export async function creerPdfBilan(b: Bilan) {
  const stations = b.seances.flatMap((x) => (x.station ? [x.station] : []));
  return renderToBuffer(
    <Document title={`${b.prenom}, bilan de parcours`} author="Blocages & Intuition" language="fr">
      <Page size="A4" style={s.page}>
        <Text style={s.marque}>Blocages &amp; Intuition</Text>
        {b.periode ? <Text style={s.periode}>{b.periode}</Text> : null}
        <Text style={s.titre}>
          {b.prenom}, {b.seances.length} séance{b.seances.length > 1 ? "s" : ""}
        </Text>
        {stations.length ? <Text style={s.mots}>{stations.join(" · ")}</Text> : null}
        {b.intention ? (
          <>
            <Text style={s.section}>L’intention du départ</Text>
            <Text>{b.intention}</Text>
          </>
        ) : null}
        <Text style={s.section}>Le chemin, séance après séance</Text>
        {b.seances.map((x) => (
          <Text key={x.numero} style={s.ligne}>
            Séance {x.numero}
            {x.date ? `, ${x.date}` : ""} : {x.mots.length ? x.mots.join(", ") : "sans mots posés"}
            {x.station ? `. ${x.station}` : ""}
          </Text>
        ))}
        {b.lettres.length ? (
          <>
            <Text style={s.section}>Les pratiques</Text>
            {b.lettres.map((l, i) => (
              <Text key={i} style={s.ligne}>
                {l.titre}
                {l.date ? `, ${l.date}` : ""}
              </Text>
            ))}
          </>
        ) : null}
        {b.paroles.length ? (
          <>
            <Text style={s.section}>Ce que tu as écrit</Text>
            {b.paroles.map((p, i) => (
              <View key={i} style={s.parole} wrap={false}>
                {p.date ? <Text style={s.date}>{p.date}</Text> : null}
                <Text>{p.texte}</Text>
              </View>
            ))}
          </>
        ) : null}
        <Text style={s.numero} render={({ pageNumber }) => `${pageNumber}`} fixed />
      </Page>
    </Document>,
  );
}
