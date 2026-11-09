import path from "node:path";
import { Document, Font, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";

// Le PDF du transcript : ivoire et Lora, le même esprit que les notes d'Émilien.
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

const IVOIRE = "#FAF6EF";
const ENCRE = "#2A2522";
const BRIQUE = "#9B3A26";

const s = StyleSheet.create({
  page: { backgroundColor: IVOIRE, color: ENCRE, fontFamily: "Lora", fontSize: 11, lineHeight: 1.6, paddingTop: 64, paddingBottom: 64, paddingHorizontal: 70 },
  marque: { fontSize: 9, fontStyle: "italic", marginBottom: 26 },
  titre: { fontSize: 26, fontWeight: 600, lineHeight: 1.1 },
  date: { fontSize: 11, fontStyle: "italic", marginTop: 6, marginBottom: 30 },
  tour: { marginBottom: 12 },
  voix: { fontSize: 8.5, fontWeight: 600, marginBottom: 2 },
  numero: { position: "absolute", bottom: 32, left: 0, right: 0, textAlign: "center", fontSize: 8.5 },
});

export type TourPdf = { locuteur: string; texte: string; cliente: boolean };

export async function creerPdfTranscript({ prenom, numero, date, tours }: { prenom: string; numero: number; date: string | null; tours: TourPdf[] }) {
  return renderToBuffer(
    <Document title={`${prenom}, séance ${numero}`} author="Blocages & Intuition" language="fr">
      <Page size="A4" style={s.page}>
        <Text style={s.marque}>Blocages &amp; Intuition</Text>
        <Text style={s.titre}>
          {prenom}, séance {numero}
        </Text>
        <Text style={s.date}>{date ?? " "}</Text>
        {tours.map((t, i) => (
          <View key={i} style={s.tour}>
            <Text style={[s.voix, t.cliente ? { color: BRIQUE } : {}]}>{t.locuteur}</Text>
            <Text style={t.cliente ? { color: BRIQUE } : {}}>{t.texte}</Text>
          </View>
        ))}
        <Text style={s.numero} render={({ pageNumber }) => `${pageNumber}`} fixed />
      </Page>
    </Document>,
  );
}
