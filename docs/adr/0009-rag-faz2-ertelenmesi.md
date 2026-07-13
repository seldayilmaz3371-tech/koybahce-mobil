# ADR 0009 — RAG Modülünün Faz 2'ye Ertelenmesi

**Durum:** Kabul edildi
**Tarih:** 2026-07-13

## Bağlam

Web projesi, doküman yükleme + embedding tabanlı RAG (Retrieval-Augmented
Generation) içeriyordu. İncelemede, 3203 embedding parçasının ana
veritabanı JSON dosyasının içine gömülü olduğu ve dosyayı 3.5 MB'a
şişirdiği tespit edildi.

## Karar

RAG, v1.0 kapsamı dışındadır. Kullanıcının kararıyla, önce temel sistem
(Parseller, Ağaçlar, Gözlemler, Fotoğraf, Sesli Not, GPS, AI Tavsiye,
Gelişim Analizi, Stok, Finans, Bildirimler, SQLite, Offline, Manuel
Yedekleme) tamamlanıp kararlı hale getirilecek; RAG ikinci fazda
bağımsız bir modül olarak eklenecek.

Mimari, bugünden bu genişlemeye kapalı olmayacak şekilde tasarlanıyor:
`documents` tablosu (dosya adı, tür, özet) ileride kurulacak, ancak
`vector_chunks`/embedding tablosu hiç oluşturulmuyor. Faz 2'de bu tablo
`documents.id`'ye yabancı anahtarla bağlanacak şekilde eklenecek.

## Gerekçe

- Kullanıcının önceliği: tamamen çalışan, kararlı, sahada kullanılabilir
  temel sistem.
- Web projesindeki hatayı tekrarlamamak için: embedding'ler, Faz 2'de
  bile ana operasyonel veriden (parsel, gözlem, finans) fiziksel olarak
  ayrı bir tabloda/dosyada tutulacak — böylece günlük kullanımın
  performansı asla gelecekteki bir AI özelliği yüzünden yavaşlamaz.

## Sonuçlar

Faz 2 başladığında SQLite'ta vektör benzerlik araması için hangi
yaklaşımın (uygulama katmanında basit cosine similarity mi, yoksa bir
uzantı mı) kullanılacağı ayrıca araştırılacak — bu henüz doğrulanmamış
bir açık konudur.
