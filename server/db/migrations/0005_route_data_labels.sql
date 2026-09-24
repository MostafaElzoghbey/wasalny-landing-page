-- 0005_route_data_labels.sql
-- Adds free-text Arabic origin/destination labels to route_data and backfills
-- them from the legacy content.routes JSON so the derived public cards keep
-- today's wording. Column names avoid the SQL keyword FROM.

ALTER TABLE route_data ADD COLUMN fromLabel TEXT NOT NULL DEFAULT '';
ALTER TABLE route_data ADD COLUMN toLabel TEXT NOT NULL DEFAULT '';
UPDATE route_data SET fromLabel = COALESCE((SELECT json_extract(j.value, '$.from') FROM content c, json_each(c.value) j WHERE c.key = 'routes' AND json_extract(j.value, '$.id') = route_data.id), fromLabel) WHERE fromLabel = '';
UPDATE route_data SET toLabel = COALESCE((SELECT json_extract(j.value, '$.to') FROM content c, json_each(c.value) j WHERE c.key = 'routes' AND json_extract(j.value, '$.id') = route_data.id), toLabel) WHERE toLabel = '';