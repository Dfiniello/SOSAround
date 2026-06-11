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
