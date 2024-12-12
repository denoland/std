#!/usr/bin/env -S deno run --allow-read --allow-write

import { parseArgs } from '@std/cli/parse-args'
import { PDFExtract, type PDFExtractOptions } from 'pdf.js-extract'

/**
 * Convert PDFExtractOptions from CLI args to a typed object.
 */
function getPDFExtractOptions(
  args: ReturnType<typeof parseArgs>,
): PDFExtractOptions {
  const options: PDFExtractOptions = {}

  if (typeof args.firstPage === 'number') options.firstPage = args.firstPage
  if (typeof args.lastPage === 'number') options.lastPage = args.lastPage
  if (typeof args.password === 'string') options.password = args.password
  if (typeof args.verbosity === 'number') options.verbosity = args.verbosity
  if (typeof args.normalizeWhitespace === 'boolean') {
    options.normalizeWhitespace = args.normalizeWhitespace
  }
  if (typeof args.disableCombineTextItems === 'boolean') {
    options.disableCombineTextItems = args.disableCombineTextItems
  }

  return options
}

async function main() {
  const args = parseArgs(Deno.args, {
    string: ['out', 'password'],
    boolean: [
      'text',
      'normalizeWhitespace',
      'disableCombineTextItems',
    ],
    default: {
      out: undefined,
      text: false,
    },
  })

  const inputPath = args._[0]
  if (typeof inputPath !== 'string' || !inputPath.endsWith('.pdf')) {
    // deno-lint-ignore no-console
    console.error(
      'Usage: pdfs input.pdf [--out=outputFile] [--text] [pdfExtractOptions...]',
    )
    Deno.exit(1)
  }

  // Determine output filename defaults
  const isTextMode = args.text === true
  let outputPath = args.out
  if (!outputPath) {
    outputPath = isTextMode ? 'pdf.txt' : 'pdf.json'
  }

  const data = await Deno.readFile(inputPath)
  const pdfExtract = new PDFExtract()
  const extractOptions = getPDFExtractOptions(args)
  const result = await pdfExtract.extractBuffer(data, extractOptions)

  if (isTextMode) {
    // In text mode, we include some basic metadata (like number of pages)
    // and then flatten all pages into a single text output separated by '---'.
    const numPages = result.pages.length
    let metadataText = `# PDF Metadata\n`
    metadataText += `Filename: ${inputPath}\n`
    metadataText += `Number of Pages: ${numPages}\n`
    if (result.meta?.info?.Title) {
      metadataText += `Title: ${result.meta.info.Title}\n`
    }
    metadataText += `\n\n`

    const pagesText = result.pages.map((page) => {
      return page.content.map((item) => item.str.trim()).join(' ')
    }).join('\n---\n')
    const fullText = metadataText + pagesText
    await Deno.writeTextFile(outputPath, fullText)
  } else {
    // Otherwise, output full JSON data
    const jsonStr = JSON.stringify(result, null, 2)
    await Deno.writeTextFile(outputPath, jsonStr)
  }
}

await main()
