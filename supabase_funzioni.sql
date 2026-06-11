-- Colonna denormalizzata: nome del bene salvato direttamente sulla segnalazione,
-- così è leggibile da TUTTI gli utenti senza permessi sulla tabella smartid.
-- Esegui questa riga nel SQL Editor di Supabase.
ALTER TABLE segnalazione ADD COLUMN IF NOT EXISTS nome_bene TEXT;

-- Backfill: copia il nome del bene nelle segnalazioni già esistenti
UPDATE segnalazione s
SET nome_bene = b.nome
FROM smartid b
WHERE s.id_bene = b.id_bene
  AND s.nome_bene IS NULL;

-- Funzione per cercare segnalazioni attive nel raggio specificato (PostGIS)
-- Esegui questa query nel SQL Editor di Supabase dopo lo schema principale

CREATE OR REPLACE FUNCTION segnalazioni_in_raggio(
  p_lat      DOUBLE PRECISION,
  p_lng      DOUBLE PRECISION,
  p_raggio_m DOUBLE PRECISION
)
RETURNS SETOF segnalazione
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM segnalazione
  WHERE stato = 'ATTIVO'
    AND ST_DWithin(
      posizione,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_raggio_m
    );
$$;
