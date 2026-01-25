-- Drop minutes and journal file path columns from session table
-- and remove 'agenda' value from session_section enum
BEGIN;

-- 1) Drop file path columns
ALTER TABLE "session" DROP COLUMN IF EXISTS "minutes_file_path";
ALTER TABLE "session" DROP COLUMN IF EXISTS "journal_file_path";

-- 2) Update any rows that still use the 'agenda' value
UPDATE session_agenda_item
SET section = 'other_matters'
WHERE section = 'agenda';

-- 3) Create the new enum type without the 'agenda' value
CREATE TYPE session_section_new AS ENUM (
  'intro',
  'opening_prayer_invocation',
  'national_anthem_and_pledge_of_allegiance',
  'roll_call',
  'reading_and_or_approval_of_minutes',
  'first_reading_and_references',
  'committee_report',
  'calendar_of_business',
  'third_reading',
  'other_matters',
  'closing_prayer',
  'adjournment'
);

-- 4) Alter dependent columns to use the new type
ALTER TABLE session_agenda_item
ALTER COLUMN section TYPE session_section_new USING section::text::session_section_new;

-- 5) Drop old type and rename new type
DROP TYPE session_section;
ALTER TYPE session_section_new RENAME TO session_section;

COMMIT;