# ADR 0023 — Native `run()` Transaction Parametresi Kök Neden Bulgusu

**Durum:** Kabul edildi — düzeltme uygulandı, gerçek testle kanıtlandı
**Tarih:** 2026-07-15 (Sprint 3.10.1, gerçek Android cihaz hatası)

## Bağlam

Sprint 3.10'da (Toplu Ağaç Oluşturma), `TreeRepository.createMany()` gerçek Android cihazda **"Failed in beginTransaction — Already in transaction"** hatasıyla başarısız oldu. Vitest'te (141/141) bu hata hiç yakalanmamıştı.

## Kök Neden (Kesin Doğrulandı — Varsayılmadı)

`@capacitor-community/sqlite`'ın gerçek tip tanımlarından (`node_modules/@capacitor-community/sqlite/dist/esm/definitions.d.ts`) doğrulandı:

```typescript
run(statement: string, values?: any[], transaction?: boolean, returnMode?: string, isSQL92?: boolean): Promise<capSQLiteChanges>;
```

`transaction` parametresi **varsayılan `true`** — her `run()` çağrısı, aksi belirtilmedikçe **kendi transaction'ını** açar/kapatır. `BaseRepository.execute()`, bu parametreyi **hiç geçirmiyordu**. `runInTransaction()` bir dış transaction açtığında, içindeki her `execute()` çağrısı (`create()`'in her tekrarı) native tarafta **ek bir iç transaction** açmaya çalışıyor, ikinci denemede "Already in transaction" hatasına yol açıyordu.

**Test ortamında neden yakalanmadı:** `testDatabaseExecutor.ts` (better-sqlite3 tabanlı), `run()`'ın `transaction` parametresini hiç tanımıyordu/simüle etmiyordu — bu yüzden bu native-özgü davranış farkı Vitest'te hiç ortaya çıkmıyordu.

## Düzeltme

1. `DatabaseExecutor.run()` imzasına gerçek native parametre eklendi: `transaction?: boolean`.
2. `BaseRepository`'ye `private inTransaction` durumu eklendi — `runInTransaction()` bunu `true`/`false` yapıyor (`finally` ile garanti).
3. `execute()`, native `run()`'a `!this.inTransaction` değerini **açıkça** geçiriyor — transaction içindeyken native'in kendi iç transaction'ını AÇMAMASI sağlanıyor.
4. **`testDatabaseExecutor.ts` gerçekçi hale getirildi** — artık native'in `transaction=true` varsayılan davranışını (kendi BEGIN/COMMIT'ini açma, zaten açıkken hata verme) **gerçekten simüle ediyor**. Bu, aynı hata sınıfının bundan sonra Vitest'te de yakalanabilmesini sağlıyor.

## Kanıt (Varsayılmadı — İki Yönlü Doğrulama)

- Düzeltme **geri alındığında**, güncellenmiş test executor'ı **gerçek Android hatasını birebir** (`"Already in transaction"`) üretti — 5 test başarısız oldu.
- Düzeltme **geri konduğunda**, tüm testler (19/19 `TreeRepository`, 1000 ağaçlık performans testi dahil) tekrar geçti.

## Etki

`runInTransaction()` kullanan (bugün sadece `TreeRepository.createMany()`) her repository metodu bu düzeltmeden yararlanıyor. Gelecekte çok adımlı bir transaction gerektiren her yeni özellik (ör. Modül 4 Finans↔Stok) bu düzeltilmiş mekanizmayı otomatik miras alacak.

## Sonuç

Bu, `BaseRepository`'nin (Modül 1'den beri var olan) `runInTransaction()`'ının **ilk gerçek kullanımında** ortaya çıkan, gerçek cihaz testi olmadan tespit edilemeyecek bir native platform detayıydı. Test altyapısı artık bu davranış sınıfını genel olarak simüle ediyor.
