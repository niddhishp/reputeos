-- Migration 012: Known Coverage URLs
-- Let users paste URLs of press coverage, interviews, podcasts they know exist.
-- These are fetched directly during scan — bypasses search entirely.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS known_urls TEXT[];  -- array of URLs: articles, YouTube, Amazon, podcasts

COMMENT ON COLUMN clients.known_urls IS
  'User-provided URLs of known press coverage, interviews, podcasts, YouTube videos, Amazon books.
   Fetched directly during discovery scan without needing search to find them.';
