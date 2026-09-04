ALTER TABLE "notifications" ADD COLUMN "email_html" TEXT;

-- Existing plain-text template content becomes safe HTML paragraphs.
UPDATE "email_templates"
SET "body_th" = '<p>' || replace(replace(replace("body_th", '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || '</p>'
WHERE "body_th" NOT LIKE '<%';

UPDATE "email_templates"
SET "body_en" = '<p>' || replace(replace(replace("body_en", '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || '</p>'
WHERE "body_en" NOT LIKE '<%';

UPDATE "email_templates"
SET
  "body_th" = replace("body_th", E'\n', '<br />'),
  "body_en" = replace("body_en", E'\n', '<br />');
