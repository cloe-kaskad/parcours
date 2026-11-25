-- ---------------------------------------------------------------------
-- 0010 : Émilien dépose son retour sous forme de document (25 novembre 2026)
--
-- Le document Word (ou un Google Doc exporté en Word) est converti en texte,
-- ses images sont gardées à part. Tout va dans l'espace de stockage « retours »,
-- qui n'acceptait que des PDF : on y ajoute le format Word et les images.
-- Rien d'autre ne change : l'espace reste privé, réservé à l'équipe
-- (politique « storage equipe », migration 0004), jamais lisible par une cliente.
-- ---------------------------------------------------------------------
update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp'
]
where id = 'retours';
