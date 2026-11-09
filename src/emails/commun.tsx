import { Body, Button, Container, Head, Html, Img, Section, Text } from "@react-email/components";

const SITE = "https://parcours.amarecherche.fr";

export function Enveloppe({ apercu, children }: { apercu: string; children: React.ReactNode }) {
  return (
    <Html lang="fr">
      <Head />
      <Body style={{ margin: 0, backgroundColor: "#E8DDD0", fontFamily: "Helvetica, Arial, sans-serif" }}>
        <div style={{ display: "none", maxHeight: 0, overflow: "hidden" }}>{apercu}</div>
        <Container style={{ maxWidth: 480, padding: "18px 12px 30px" }}>
          <Section style={{ backgroundColor: "#FAF6EF", borderRadius: 4, padding: "30px 26px 34px" }}>
            <Img src={`${SITE}/marque/logo-violet.png`} alt="Blocages & Intuition" height="36" />
            {children}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function Paragraphe({ children, discret = false }: { children: React.ReactNode; discret?: boolean }) {
  return <Text style={{ fontSize: discret ? 14 : 16, lineHeight: "1.65", color: discret ? "#59114D" : "#111111", margin: "18px 0 0" }}>{children}</Text>;
}

export function Bouton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button href={href} style={{ display: "inline-block", marginTop: 18, backgroundColor: "#E6361D", color: "#F5EDE3", borderRadius: 999, padding: "15px 24px 13px", fontSize: 17, fontWeight: 600 }}>
      {children}
    </Button>
  );
}

export const lienSite = (chemin: string) => `${SITE}${chemin}`;
