-- Rename session_section enum values to match updated schema
-- Changes: intro → call_to_order, reading_and_or_approval_of_minutes → reading_and_or_approval_of_the_minutes,
--          first_reading_and_references → first_reading_and_reference_of_business,
--          committee_report → committee_reports, closing_prayer → closing_prayers
BEGIN;

-- 1) Create the new enum type with updated values
CREATE TYPE session_section_new AS ENUM (
    'call_to_order',
    'opening_prayer_invocation',
    'national_anthem_and_pledge_of_allegiance',
    'roll_call',
    'reading_and_or_approval_of_the_minutes',
    'first_reading_and_reference_of_business',
    'committee_reports',
    'calendar_of_business',
    'third_reading',
    'other_matters',
    'closing_prayers',
    'adjournment'
);

-- 2) Update existing rows from old values to new values
UPDATE session_agenda_item SET section = 'call_to_order' WHERE section = 'intro';
UPDATE session_agenda_item SET section = 'reading_and_or_approval_of_the_minutes' WHERE section = 'reading_and_or_approval_of_minutes';
UPDATE session_agenda_item SET section = 'first_reading_and_reference_of_business' WHERE section = 'first_reading_and_references';
UPDATE session_agenda_item SET section = 'committee_reports' WHERE section = 'committee_report';
UPDATE session_agenda_item SET section = 'closing_prayers' WHERE section = 'closing_prayer';

-- 3) Alter dependent columns to use the new type
ALTER TABLE session_agenda_item
ALTER COLUMN section TYPE session_section_new USING section::text::session_section_new;

-- 4) Drop old type and rename new type
DROP TYPE session_section;
ALTER TYPE session_section_new RENAME TO session_section;

COMMIT;
