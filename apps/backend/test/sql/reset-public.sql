DO $$
DECLARE
	tables text;
BEGIN
	SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
	INTO tables
	FROM pg_tables
	WHERE schemaname = 'public'
	  AND tablename <> '_prisma_migrations';

	IF tables IS NOT NULL THEN
		EXECUTE 'TRUNCATE TABLE ' || tables || ' RESTART IDENTITY CASCADE';
	END IF;
END $$;
