# pdf.js-extract

extracts text from PDF files

This is just a library packaged out of the examples for usage of pdf.js with
nodejs.

It reads a pdf file and exports all pages & texts with coordinates. This can be
e.g. used to extract structured table data.

This package includes a build of [pdf.js](https://github.com/mozilla/pdf.js).
why? [pdfs-dist](https://github.com/mozilla/pdfjs-dist) installs not needed
dependencies into production deployment.

Note: NO OCR!

## Install

[![NPM](https://nodei.co/npm/pdf.js-extract.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/pdf.js-extract/)

![test](https://github.com/ffalt/pdf.js-extract/workflows/test/badge.svg)
[![license](https://img.shields.io/npm/l/pdf.js-extract.svg)](http://opensource.org/licenses/MIT)

## Example Usage

javascript async with callback

```javascript
const PDFExtract = require('pdf.js-extract').PDFExtract
const pdfExtract = new PDFExtract()
const options = {} /* see below */
pdfExtract.extract('test.pdf', options, (err, data) => {
  if (err) return console.log(err)
  console.log(data)
})
```

javascript async with callback using buffer

```javascript
const PDFExtract = require('pdf.js-extract').PDFExtract
const pdfExtract = new PDFExtract()
const fs = require('fs')
const buffer = fs.readFileSync('./example.pdf')
const options = {} /* see below */
pdfExtract.extractBuffer(buffer, options, (err, data) => {
  if (err) return console.log(err)
  console.log(data)
})
```

typescript async with promise

```typescript
import { PDFExtract, PDFExtractOptions } from 'pdf.js-extract'
const pdfExtract = new PDFExtract()
const options: PDFExtractOptions = {} /* see below */
pdfExtract.extract('test.pdf', options)
  .then((data) => console.log(data))
  .catch((err) => console.log(err))
```

## Options

```typescript
export interface PDFExtractOptions {
  firstPage?: number // default:`1` - start extract at page nr
  lastPage?: number //  stop extract at page nr, no default value
  password?: string //  for decrypting password-protected PDFs., no default value
  verbosity?: number // default:`-1` - log level of pdf.js
  normalizeWhitespace?: boolean // default:`false` - replaces all occurrences of whitespace with standard spaces (0x20).
  disableCombineTextItems?: boolean // default:`false` - do not attempt to combine  same line {@link TextItem}'s.
}
```

Example Output

```json
{
  "filename": "helloworld.pdf",
  "meta": {
    "info": {
      "PDFFormatVersion": "1.7",
      "IsAcroFormPresent": false,
      "IsCollectionPresent": false,
      "IsLinearized": true,
      "IsXFAPresent": false
    },
    "metadata": {
      "dc:format": "application/pdf",
      "dc:creator": "someone",
      "dc:title": "This is a hello world PDF file",
      "xmp:createdate": "2000-06-29T10:21:08+11:00",
      "xmp:creatortool": "Microsoft Word 8.0",
      "xmp:modifydate": "2013-10-28T15:24:13-04:00",
      "xmp:metadatadate": "2013-10-28T15:24:13-04:00",
      "pdf:producer": "Acrobat Distiller 4.0 for Windows",
      "xmpmm:documentid": "uuid:0205e221-80a8-459e-a522-635ed5c1e2e6",
      "xmpmm:instanceid": "uuid:68d6ae6d-43c4-472d-9b28-7c4add8f9e46"
    }
  },
  "pages": [
    {
      "pageInfo": {
        "num": 1,
        "scale": 1,
        "rotation": 0,
        "offsetX": 0,
        "offsetY": 0,
        "width": 200,
        "height": 200
      },
      "links": [
        "https://github.com"
      ],
      "content": [
        {
          "x": 70,
          "y": 150,
          "str": "Hello, world!",
          "dir": "ltr",
          "width": 64.656,
          "height": 12,
          "fontName": "Times"
        }
      ]
    }
  ],
  "pdfInfo": {
    "numPages": 1,
    "fingerprint": "1ee9219eb9eaa49acbfc20155ac359c3"
  }
}
```
