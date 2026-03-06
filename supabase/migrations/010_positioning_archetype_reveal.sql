-- Migration 010: Store rich archetype reveal data in positioning table
ALTER TABLE positioning
  ADD COLUMN IF NOT EXISTS archetype_reveal JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS alternate_archetype JSONB DEFAULT '{}'::jsonb;
