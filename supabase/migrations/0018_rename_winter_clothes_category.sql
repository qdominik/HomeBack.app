-- Cel:
-- Zmiana tylko etykiety globalnej kategorii systemowej o stabilnym kluczu
-- 'winter_clothes' z "Ubrania zimowe" na "Ubrania".
--
-- Wplyw na dane:
-- Aktualizuje nazwe pojedynczej kategorii systemowej (household_id is null).
-- Klucz techniczny 'winter_clothes', mapowanie ikon i referencje Rzeczy
-- pozostaja bez zmian. Warunek na poprzedniej nazwie czyni migracje
-- idempotentna takze dla baz, ktore juz otrzymaly zaktualizowany seed 0001.
--
-- Cofniecie:
-- Przywrocic nazwe 'Ubrania zimowe' dla key = 'winter_clothes' w osobnej
-- zatwierdzonej migracji po upewnieniu sie, ze nie ma zaleznosci danych.
--
-- RLS:
-- Bez zmian. Istniejace polityki kategorii systemowych nadal chronia wiersz.
--
-- Test:
-- `npm run test:logic` (test statyczny kontraktu migracji) oraz, przy
-- dzialajacym Supabase lokalnie:
-- select nazwa from public.category where key = 'winter_clothes';

update public.category
set nazwa = 'Ubrania'
where key = 'winter_clothes'
  and household_id is null
  and nazwa = 'Ubrania zimowe';
