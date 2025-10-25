/*
  # Tüm Tabloları ve Fonksiyonları Temizle

  1. Silinen Öğeler
    - request_assignments tablosu
    - cleaning_requests tablosu
    - profiles tablosu
    - is_admin() fonksiyonu

  2. Amaç
    - Temiz bir başlangıç için mevcut yapıyı tamamen kaldır
*/

-- Tabloları CASCADE ile sil (foreign key'ler otomatik silinir)
DROP TABLE IF EXISTS request_assignments CASCADE;
DROP TABLE IF EXISTS cleaning_requests CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Fonksiyonu sil
DROP FUNCTION IF EXISTS is_admin() CASCADE;