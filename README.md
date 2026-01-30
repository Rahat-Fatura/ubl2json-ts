# UBL2JSON-TS

[![npm version](https://badge.fury.io/js/ubl2json-ts.svg)](https://www.npmjs.com/package/ubl2json-ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Türkiye e-Belge sistemi için kullanılan UBLTR XML formatındaki belgelerin JSON objesine dönüştürülmesi için modern TypeScript kütüphanesi.

## Desteklenen Belge Türleri

| Belge Türü | Sınıf | Durum |
|------------|-------|-------|
| **e-Fatura / e-Arşiv Fatura** | `InvoiceConverter` | ✅ Tam destek |
| **e-İrsaliye** | `DespatchConverter` | ✅ Tam destek |
| **e-Müstahsil** | `ReceiptConverter` | 🔜 Yakında |

## Özellikler

- **TypeScript First**: Tam tip desteği ile güvenli geliştirme
- **Class-Based API**: Modern ve genişletilebilir yapı
- **Minimal Dependencies**: Sadece `fast-xml-parser` bağımlılığı
- **Tree-Shakeable**: ESM ve CJS desteği
- **Performant**: Hızlı XML parsing
- **VKN/TCKN Koruması**: Vergi numaraları string olarak korunur (başındaki 0'lar kaybolmaz)

## Kurulum

```bash
yarn add ubl2json-ts
# veya
npm install ubl2json-ts
```

## Hızlı Başlangıç

### e-Fatura Dönüştürme

```typescript
import { InvoiceConverter } from 'ubl2json-ts';
import fs from 'fs';

const converter = new InvoiceConverter();
const xml = fs.readFileSync('fatura.xml', 'utf-8');
const invoice = converter.convert(xml);

console.log(invoice.uuid);           // "550e8400-e29b-41d4-a716-446655440000"
console.log(invoice.number);         // "ABC2024000000001"
console.log(invoice.senderName);     // "Test Satıcı A.Ş."
console.log(invoice.receiverName);   // "Test Alıcı Ltd."
console.log(invoice.payableAmount);  // 1180.00
console.log(invoice.currencyCode);   // "TRY"
```

### e-İrsaliye Dönüştürme

```typescript
import { DespatchConverter } from 'ubl2json-ts';
import fs from 'fs';

const converter = new DespatchConverter();
const xml = fs.readFileSync('irsaliye.xml', 'utf-8');
const despatch = converter.convert(xml);

console.log(despatch.uuid);          // "550e8400-e29b-41d4-a716-446655440000"
console.log(despatch.number);        // "IRS2024000000001"
console.log(despatch.senderName);    // "Gönderici A.Ş."
console.log(despatch.receiverName);  // "Alıcı Ltd."
console.log(despatch.lines.length);  // 5

// Shipment bilgileri
if (despatch.shipment) {
  console.log(despatch.shipment.licensePlate);  // "34ABC123"
  console.log(despatch.shipment.driver?.firstName);  // "Ahmet"
}
```

## Detaylı Kullanım

### Raw JSON Alma

Ham XML yapısına erişmek için `parseToRaw` metodunu kullanabilirsiniz:

```typescript
import { InvoiceConverter } from 'ubl2json-ts';

const converter = new InvoiceConverter();
const rawJson = converter.parseToRaw(xml);

// Ham XML yapısına erişim
console.log(rawJson.Invoice.UUID.val);
console.log(rawJson.Invoice.AccountingSupplierParty.Party.PartyName.Name.val);
```

### İhracat Faturaları İçin Özel Ayar

```typescript
import { InvoiceConverter } from 'ubl2json-ts';

const converter = new InvoiceConverter({
  setBuyerCustomerToReceiverForExportInvoices: true,
});

const invoice = converter.convert(xml);
// İhracat faturalarında BuyerCustomerParty otomatik olarak ReceiverParty olarak atanır
```

### Tip Tanımlarını Kullanma

```typescript
import type { Invoice, DespatchAdvice, Party, InvoiceLine, DespatchLine } from 'ubl2json-ts';

function processInvoice(invoice: Invoice): void {
  const sender: Party = invoice.senderObject;
  const lines: InvoiceLine[] = invoice.lines;
  
  lines.forEach(line => {
    console.log(`${line.name}: ${line.price} ${line.priceCurrency}`);
  });
}

function processDespatch(despatch: DespatchAdvice): void {
  const lines: DespatchLine[] = despatch.lines;
  
  lines.forEach(line => {
    console.log(`${line.name}: ${line.quantity} ${line.quantityUnit}`);
  });
}
```

### Enum Kullanımı

```typescript
import { DespatchProfileId, DespatchTypeCode } from 'ubl2json-ts';

// ProfileID kontrolü
if (despatch.profileId === DespatchProfileId.TEMELIRSALIYE) {
  console.log('Temel İrsaliye');
}

// TypeCode kontrolü
if (despatch.typeCode === DespatchTypeCode.SEVK) {
  console.log('Sevk İrsaliyesi');
}
```

## API Referansı

### InvoiceConverter

```typescript
new InvoiceConverter(options?: InvoiceConverterOptions)
```

**Options:**
| Parametre | Tip | Default | Açıklama |
|-----------|-----|---------|----------|
| `setBuyerCustomerToReceiverForExportInvoices` | `boolean` | `false` | İhracat faturalarında BuyerCustomerParty'yi ReceiverParty olarak ata |

**Methods:**
| Method | Açıklama | Dönüş Tipi |
|--------|----------|------------|
| `convert(xml)` | XML'i normalize edilmiş Invoice'a dönüştürür | `Invoice` |
| `parseToRaw(xml)` | XML'i ham JSON'a parse eder | `ParsedInvoiceXmlRoot` |
| `updateOptions(options)` | Converter seçeneklerini günceller | `void` |
| `getOptions()` | Mevcut seçenekleri döndürür | `InvoiceConverterOptions` |

### DespatchConverter

```typescript
new DespatchConverter()
```

**Methods:**
| Method | Açıklama | Dönüş Tipi |
|--------|----------|------------|
| `convert(xml)` | XML'i normalize edilmiş DespatchAdvice'a dönüştürür | `DespatchAdvice` |
| `parseToRaw(xml)` | XML'i ham JSON'a parse eder | `ParsedDespatchXmlRoot` |

### Çıktı Tipleri

#### Invoice

```typescript
interface Invoice {
  uuid: string;
  number: string;
  profileId: string;
  typeCode: string;
  issueDatetime: Date;
  notes: string[];
  currencyCode: string;
  exchangeRate: number;
  senderObject: Party;
  senderName: string;
  senderTax: string | undefined;
  receiverObject: Party;
  receiverName: string;
  receiverTax: string | undefined;
  lineExtension: number;
  taxExclusive: number;
  taxInclusive: number;
  taxTotal: number;
  taxSubtotals: TaxSubtotal[];
  withholdingTaxTotal: number;
  withholdingTaxSubtotals: TaxSubtotal[];
  allowanceTotal: number;
  chargeTotal: number;
  payableAmount: number;
  lines: InvoiceLine[];
  despatches: DespatchReference[];
  order: OrderReference | null;
  paymentMeans: PaymentMeans[];
  additionalDocumentReference: AdditionalDocumentReference[];
  buyerCustomerObject: Party | null;
  buyerCustomerName: string | undefined;
  buyerCustomerTax: string | undefined;
}
```

#### DespatchAdvice

```typescript
interface DespatchAdvice {
  uuid: string;
  number: string;
  profileId: string;
  typeCode: string;
  issueDatetime: Date;
  notes: string[];
  lineCount: number;
  senderObject: Party;
  senderName: string;
  senderTax: string | undefined;
  receiverObject: Party;
  receiverName: string;
  receiverTax: string | undefined;
  shipment: ShipmentInfo | null;
  lines: DespatchLine[];
  additionalDocumentReference: AdditionalDocumentReference[];
}
```

#### ShipmentInfo

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

## Hata Yönetimi

```typescript
import { InvoiceConverter, DespatchConverter, UblParseError } from 'ubl2json-ts';

const invoiceConverter = new InvoiceConverter();
const despatchConverter = new DespatchConverter();

try {
  const invoice = invoiceConverter.convert(invalidXml);
} catch (error) {
  if (error instanceof UblParseError) {
    console.error('XML parse hatası:', error.message);
    console.error('Sebep:', error.cause);
  }
}
```

## Geliştirme

```bash
# Bağımlılıkları yükle
yarn install

# Build
yarn build

# Test
yarn test:run

# Invoice JSON çıktısını görüntüle
yarn test:invoice

# Despatch JSON çıktısını görüntüle
yarn test:despatch
```

## Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'feat: add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## Lisans

MIT License - Detaylı bilgi için [LICENSE](LICENSE) dosyasına bakın.

## Yazar

**Berkay Gökçe** - [berkaygkc7@gmail.com](mailto:berkaygkc7@gmail.com)

---

Made with ❤️ by [RahatSistem](https://github.com/Rahat-Fatura)
