-- Raw SQL (Prisma cannot express triggers). See DEPLOYMENT.md.
-- Accounting integrity: a POSTED journal entry's lines MUST balance
-- (sum of debits = sum of credits) and must exist. Enforced by DEFERRED
-- constraint triggers so multi-row line inserts within a transaction are allowed,
-- but an unbalanced/empty POSTED entry can never COMMIT — on ANY write path.
-- DRAFT entries may be temporarily unbalanced.

CREATE OR REPLACE FUNCTION assert_journal_balanced(p_entry text) RETURNS void AS $$
DECLARE
  v_status text;
  v_debit  numeric;
  v_credit numeric;
BEGIN
  SELECT "status" INTO v_status FROM "JournalEntry" WHERE "id" = p_entry;
  IF v_status IS NULL OR v_status IS DISTINCT FROM 'POSTED' THEN
    RETURN; -- entry gone, or still a draft: not enforced
  END IF;
  SELECT COALESCE(SUM("debit"), 0), COALESCE(SUM("credit"), 0)
    INTO v_debit, v_credit
    FROM "JournalLine" WHERE "entryId" = p_entry;
  IF v_debit = 0 AND v_credit = 0 THEN
    RAISE EXCEPTION 'Posted journal entry % has no lines', p_entry USING ERRCODE = 'check_violation';
  END IF;
  IF v_debit <> v_credit THEN
    RAISE EXCEPTION 'Journal entry % is unbalanced: debit % <> credit %', p_entry, v_debit, v_credit
      USING ERRCODE = 'check_violation';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_journal_line_balanced() RETURNS trigger AS $$
BEGIN
  PERFORM assert_journal_balanced(COALESCE(NEW."entryId", OLD."entryId"));
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_journal_entry_balanced() RETURNS trigger AS $$
BEGIN
  PERFORM assert_journal_balanced(NEW."id");
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER journal_line_balance
  AFTER INSERT OR UPDATE OR DELETE ON "JournalLine"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION trg_journal_line_balanced();

CREATE CONSTRAINT TRIGGER journal_entry_balance
  AFTER INSERT OR UPDATE ON "JournalEntry"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION trg_journal_entry_balanced();
