# Test Stratejisi Soruları

Bu dosya, testlerin daha genel ve esnek olması için ihtiyaç duyulan bilgileri içerir.

## Sorular

### 1. Zorunlu Alanlar
XML dosyalarında **her zaman** bulunması gereken alanlar hangileri?

Örnek:
- `UUID` - Her zaman var mı? - var
- `ID` (fatura numarası) - Her zaman var mı? - var
- `ProfileID` - Her zaman var mı? - var
- `InvoiceTypeCode` - Her zaman var mı? - var 
- `IssueDate` - Her zaman var mı? - var
- `DocumentCurrencyCode` - Her zaman var mı? - var
- `TaxTotal` - Her zaman var mı? - duruma göre olmayabiliyor
- `LegalMonetaryTotal` - Her zaman var mı? - var
- `InvoiceLine` - En az 1 satır her zaman var mı? - var

### 2. Opsiyonel Alanlar
Hangi alanlar opsiyonel (bazen boş/eksik olabilir)?

- `IssueTime` - Opsiyonel mi? - opsiyonel
- `Note` - Opsiyonel mi? Birden fazla olabilir mi? - opsiyonel ve bir veya daha fazla olabilir
- `OrderReference` - Opsiyonel mi? - opsiyonel tek olmak zorunda
- `DespatchDocumentReference` - Opsiyonel mi? Birden fazla olabilir mi? - opsiyonel bir ve birden fazla olabilir
- `PricingExchangeRate` - Opsiyonel mi? - opsiyonel tek olmak zorunda
- `BuyerCustomerParty` - Opsiyonel mi? - opsiyonel tek olmak zorunda
- `WithholdingTaxTotal` - Opsiyonel mi? - opsiyonel tek olmak zorunda
- `AllowanceCharge` - Opsiyonel mi? - opsiyonel tek olmak zorunda
- `PaymentMeans` - Opsiyonel mi? - opsiyonel tek olmak zorunda
- `AdditionalDocumentReference` - Opsiyonel mi? - opsiyonel bir veya daha fazla olabilir

### 3. VKN/TCKN Kuralları
- VKN her zaman 10 hane mi? - evet
- TCKN her zaman 11 hane mi? - evet
- Sormamışsın ama id?.ID?.schemeID === 'PARTYTYPE' bu ihtimal de var ihracat faturalarında. bu durumda bu bilgi herhangi bir sayıda olabilir. yurt dışı vergi nosu çünkü ve serbest alan, sadece rakamlardan oluşmalı ve çıktı olarak string olmalı.
- Başında 0 olabilir mi? (Bunu zaten ele aldık - evet)
- Hem sender hem receiver için VKN veya TCKN **mutlaka** var mı? - evet
- `PARTYTYPE` gibi diğer schemeID'ler ne zaman kullanılıyor? -  yukarıda yanıtladım.

### 4. Veri Tipleri
- `taxTotal` her zaman sayısal mı (0 olabilir mi)? - her zaman sayısal ancak 0 da olabilir ancak hiç olmayabilir.
- `lineExtension`, `taxExclusive`, `taxInclusive`, `payableAmount` her zaman var mı? - her zmaan olmayabilir
- `exchangeRate` yoksa varsayılan 1 mi? - yoksa varsayılan 1

### 5. ProfileID Değerleri
Hangi ProfileID değerleri geçerli?
- `TICARIFATURA`
- `TEMELFATURA`
- `IHRACAT`
- `YOLCUBERABERFATURA`
- `EARSIVFATURA`
- `ILAC_TIBBICIHAZ`
- Başka?
- Direk uygulama kaynak kodu:
    EInvoiceProfileID["TICARIFATURA"] = "TICARIFATURA";
    EInvoiceProfileID["TEMELFATURA"] = "TEMELFATURA";
    EInvoiceProfileID["YOLCUBERABERFATURA"] = "YOLCUBERABERFATURA";
    EInvoiceProfileID["IHRACAT"] = "IHRACAT";
    EInvoiceProfileID["OZELFATURA"] = "OZELFATURA";
    EInvoiceProfileID["KAMU"] = "KAMU";
    EInvoiceProfileID["HKS"] = "HKS";
    EInvoiceProfileID["ILAC_TIBBICIHAZ"] = "ILAC_TIBBICIHAZ";

### 6. InvoiceTypeCode Değerleri
Hangi InvoiceTypeCode değerleri geçerli?
- `SATIS`
- `IADE`
- `TEVKIFAT`
- `ISTISNA`
- `OZELMATRAH`
- `IHRACKAYITLI`
- Başka?
- Direk uygulama kaynak kodu:
  EInvoiceTypeCode["SATIS"] = "SATIS";
  EInvoiceTypeCode["IADE"] = "IADE";
  EInvoiceTypeCode["TEVKIFAT"] = "TEVKIFAT";
  EInvoiceTypeCode["ISTISNA"] = "ISTISNA";
  EInvoiceTypeCode["OZELMATRAH"] = "OZELMATRAH";
  EInvoiceTypeCode["IHRACKAYITLI"] = "IHRACKAYITLI";
  EInvoiceTypeCode["SGK"] = "SGK";
  EInvoiceTypeCode["KOMISYONCU"] = "KOMISYONCU";

### 7. Test Senaryoları
Hangi edge case'leri test etmemiz gerekiyor?
- Boş `Note` array'i
- `TaxSubtotal` olmayan fatura
- Sıfır tutarlı fatura
- Sadece 1 satırlı fatura
- Çok satırlı fatura (50+ satır)
- Yabancı para birimi ile fatura (USD, EUR)
- `BuyerCustomerParty` olan ihracat faturası
- resources/invoice altına ihracat.xml ekledim onu kullanabilirsin ihracat için.

---

## Cevaplarınız

Lütfen yukarıdaki soruları cevaplayın, testleri ona göre güncelleyeceğim.

Örnek format:
```
1. Zorunlu Alanlar:
   - UUID: Evet, her zaman var
   - IssueTime: Hayır, opsiyonel
   ...
```
