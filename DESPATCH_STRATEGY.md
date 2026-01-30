# DespatchConverter - Soru İşaretleri ve Doğrulama Gereken Noktalar

Bu dosya, DespatchConverter geliştirmesi sırasında ortaya çıkan ve doğrulanması gereken noktaları içerir.

## Tamamlanan İşler

1. **DespatchConverter sınıfı oluşturuldu**
   - XML'i parse edip `DespatchAdvice` tipinde JSON çıktı veriyor
   - InvoiceConverter ile benzer yapıda

2. **Tip tanımlamaları eklendi**
   - Raw tipler: `RawDespatchAdvice`, `RawDespatchLine`, `RawDespatchShipment`, vb.
   - Normalized tipler: `DespatchAdvice`, `DespatchLine`, `ShipmentInfo`, `DriverPerson`, `CarrierParty`, `DeliveryAddress`

3. **Ortak yapılar kullanıldı**
   - `normalizeParty()` fonksiyonu hem Invoice hem Despatch için kullanılıyor
   - `parserOptions` aynı config ile çalışıyor

4. **Testler yazıldı (162 test geçiyor)**
   - Yapısal testler (belirli değerlere bağlı değil)
   - 17 gerçek XML dosyası ile test

---

## Sorular

### 1. ProfileID Değerleri
İrsaliye için geçerli ProfileID değerleri neler?
- `TEMELIRSALIYE` - bu doğru mu?
- Başka profil ID'leri var mı? (örn: `EARSIVIRS`, `OZELFATURA` gibi)
- koddan:
  EDespatchProfileID["TEMELIRSALIYE"] = "TEMELIRSALIYE";
  EDespatchProfileID["HKSIRSALIYE"] = "HKSIRSALIYE";

### 2. DespatchAdviceTypeCode Değerleri
Hangi tip kodları geçerli?
- `SEVK` - normal sevk irsaliyesi - 
- Başka tip kodları var mı? 
- koddan:
  EDespatchTypeCode["SEVK"] = "SEVK";
  EDespatchTypeCode["MATBUDAN"] = "MATBUDAN";

### 3. Zorunlu Alanlar
Aşağıdaki alanlar her zaman var mı?
- `UUID` - var mı? zorunlu
- `ID` (irsaliye numarası) - var mı? zorunlu
- `ProfileID` - var mı? zorunlu
- `DespatchAdviceTypeCode` - var mı? zorunlu
- `IssueDate` - var mı? zorunlu
- `DespatchSupplierParty` - var mı? zorunlu
- `DeliveryCustomerParty` - var mı? zorunlu
- `DespatchLine` - en az 1 satır her zaman var mı? zorunlu

### 4. Opsiyonel Alanlar
Hangi alanlar opsiyonel?
- `IssueTime` - opsiyonel mi? - fatura ile aynı
- `Note` - opsiyonel mi? Birden fazla olabilir mi? - fatura ile aynı
- `Shipment` - opsiyonel mi? - fatura ile aynı
- `LineCountNumeric` - opsiyonel mi? - zorunlu
- `AdditionalDocumentReference` - opsiyonel mi? - fatura ile aynı

### 5. Shipment Yapısı
Shipment içindeki yapılar:
- `ShipmentStage` - her zaman var mı? Birden fazla olabilir mi? tek
- `DriverPerson` - opsiyonel mi? - opsiyonel
- `TransportMeans` - opsiyonel mi? - opsiyonel
- `CarrierParty` - opsiyonel mi? - opsiyonel
- `DeliveryAddress` - opsiyonel mi? - opsiyonel
- `Despatch` (ActualDespatchDate/Time) - opsiyonel mi? - opsiyonel

### 6. DespatchLine Yapısı
İrsaliye satırında:
- `DeliveredQuantity` - her zaman var mı? - zorunlu
- `OrderLineReference` - opsiyonel mi? - opsiyonel
- `Item` - her zaman var mı? - zorunlu
- Fiyat/tutar bilgisi hiç olmuyor mu? (Invoice'dan farklı olarak) - opsiyonel isteyen gönderebilir, o kısım fatura ile aynı ancak vergi vs yok

### 7. VKN/TCKN Kuralları
- Sender ve receiver için VKN/TCKN **mutlaka** var mı? var
- CarrierParty (taşıyıcı) için VKN zorunlu mu? - opsiyonel

### 8. Ek Özellikler İsteniyor mu?
- `OriginatorDocumentReference` - sipariş referansı gerekli mi? - opsiyonel
- `BuyerCustomerParty` - alıcı müşteri ayrımı var mı? - opsiyonel
- Birden fazla teslimat adresi olabilir mi? - olamaz

---

## Mevcut Yapı

### DespatchAdvice Çıktı Yapısı
```typescript
interface DespatchAdvice {
  uuid: string;
  envelopeUuid: string | null;
  number: string;
  profileId: string;
  typeCode: string;
  issueDatetime: Date;
  envelopeDatetime: Date | null;
  notes: string[];
  lineCount: number;
  additionalDocumentReference: AdditionalDocumentReference[];
  senderObject: Party;
  senderName: string;
  senderTax: string | undefined;
  senderDespatchContact: string | undefined;
  receiverObject: Party;
  receiverName: string;
  receiverTax: string | undefined;
  shipment: ShipmentInfo | null;
  lines: DespatchLine[];
}
```

### ShipmentInfo Yapısı
```typescript
interface ShipmentInfo {
  transportModeCode: string | undefined;
  licensePlate: string | undefined;
  driver: DriverPerson | null;
  carrierParty: CarrierParty | null;
  deliveryAddress: DeliveryAddress | null;
  actualDespatchDate: string | undefined;
  actualDespatchTime: string | undefined;
}
```

### DespatchLine Yapısı
```typescript
interface DespatchLine {
  id: string | undefined;
  name: string | undefined;
  note: string | undefined;
  quantity: number;
  quantityUnit: string | undefined;
  orderLineId: string | undefined;
  sellersItemId: string | undefined;
  buyersItemId: string | undefined;
}
```

---

## Cevaplarınız

Lütfen yukarıdaki soruları cevaplayın, gerekli düzeltmeleri yapacağım.

Örnek format:
```
1. ProfileID Değerleri:
   - TEMELIRSALIYE: Evet, doğru
   - Başka: EARSIVIRS de var
   ...
```
