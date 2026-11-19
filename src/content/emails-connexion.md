# Emails de connexion, à coller dans Supabase

Où : supabase.com → le projet → Authentication → Emails → Templates. Ils partent par Resend une fois « Custom SMTP » réglé (guide, étape B4). Le lien passe par /auth/callback avec un jeton à usage unique : il marche même ouvert sur un autre appareil que celui de la demande.

## 1. « Magic Link » (le lien pour entrer)

Sujet :

```
Ton lien pour entrer dans ton espace
```

Corps (HTML) :

```html
<div style="background:#FAF6EF;padding:32px 20px;font-family:'DM Sans',Helvetica,Arial,sans-serif;color:#111111">
  <div style="max-width:520px;margin:0 auto;background:#FFFFFF;border:1px solid rgba(89,17,77,.14);border-radius:8px;padding:28px 26px">
    <p style="margin:0 0 6px;font-size:13px;letter-spacing:.06em;color:#59114D;font-weight:600">BLOCAGES &amp; INTUITION</p>
    <p style="margin:0 0 18px;font-size:24px;line-height:1.15;color:#59114D;font-weight:600">Ton espace t’attend.</p>
    <p style="margin:0 0 22px;font-size:16px;line-height:1.6">Voici ton lien pour entrer. Il marche une seule fois, pendant une heure.</p>
    <p style="margin:0 0 26px"><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink" style="display:inline-block;background:#E6361D;color:#F5EDE3;text-decoration:none;font-weight:600;font-size:16px;padding:14px 22px;border-radius:999px">Entrer dans mon espace</a></p>
    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#59114D">Pour ne plus passer par ta boîte mail : une fois dans ton espace, « Mon compte » te permet de créer un mot de passe ou de relier ton compte Google.</p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#888888">Tu n’as rien demandé ? Tu peux ignorer ce message.</p>
  </div>
</div>
```

## 2. « Reset Password » (créer ou retrouver son mot de passe)

Sujet :

```
Choisir ton mot de passe
```

Corps (HTML) :

```html
<div style="background:#FAF6EF;padding:32px 20px;font-family:'DM Sans',Helvetica,Arial,sans-serif;color:#111111">
  <div style="max-width:520px;margin:0 auto;background:#FFFFFF;border:1px solid rgba(89,17,77,.14);border-radius:8px;padding:28px 26px">
    <p style="margin:0 0 6px;font-size:13px;letter-spacing:.06em;color:#59114D;font-weight:600">BLOCAGES &amp; INTUITION</p>
    <p style="margin:0 0 18px;font-size:24px;line-height:1.15;color:#59114D;font-weight:600">Ton mot de passe.</p>
    <p style="margin:0 0 22px;font-size:16px;line-height:1.6">Ce lien t’ouvre la page où le choisir (douze caractères au moins). Il marche une seule fois, pendant une heure.</p>
    <p style="margin:0 0 26px"><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&suite=/mot-de-passe" style="display:inline-block;background:#E6361D;color:#F5EDE3;text-decoration:none;font-weight:600;font-size:16px;padding:14px 22px;border-radius:999px">Choisir mon mot de passe</a></p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#888888">Tu n’as rien demandé ? Ton mot de passe actuel ne change pas. Tu peux ignorer ce message.</p>
  </div>
</div>
```
