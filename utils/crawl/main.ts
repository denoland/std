// main.ts
import { DOMParser, initParser } from 'jsr:@b-fuze/deno-dom/wasm-noinit'
import { htmlToText } from 'npm:html-to-text'

interface PageData {
  url: string
  links: string[]
  text: string
}

const crawlPage = async (url: string, startUrl: string): Promise<PageData> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch fail ${url}: ${res.status}`)
  const html = await res.text()
  const doc = new DOMParser().parseFromString(html, 'text/html')
  if (!doc) return { url, links: [], text: '' }

  const baseHost = new URL(startUrl).hostname

  const links = [...doc.querySelectorAll('a')]
    .map((a) => a.getAttribute('href') || '')
    .map((l) => {
      try {
        return new URL(l, url).href
      } catch {
        return ''
      }
    })
    .filter((l) => {
      try {
        return new URL(l).hostname === baseHost
      } catch {
        return false
      }
    })

  const text = htmlToText(html, {
    wordwrap: 0,
    baseElements: {
      selectors: ['main', 'article', 'body'],
      returnDomByDefault: false,
    },
    selectors: [
      { selector: 'header', format: 'skip' },
      { selector: 'footer', format: 'skip' },
      { selector: 'nav', format: 'skip' },
      { selector: 'aside', format: 'skip' },
      { selector: '.sidebar', format: 'skip' },
    ],
  })

  return { url, links, text }
}

const crawl = async (startUrl: string, maxDepth = 0) => {
  await initParser()
  const visited = new Set<string>()
  let queue = [{ url: startUrl, depth: 0 }]
  await Deno.writeTextFile('crawl.txt', '')
  while (queue.length > 0) {
    const { url, depth } = queue.shift()!
    if (visited.has(url) || depth > maxDepth) continue
    visited.add(url)
    const { links, text } = await crawlPage(url, startUrl)
    console.log(`Links from ${url}:`, links)
    await Deno.writeTextFile('crawl.txt', `URL: ${url}\n${text}\n\n`, {
      append: true,
    })
    for (const link of links) {
      if (!visited.has(link)) queue.push({ url: link, depth: depth + 1 })
    }
  }
}

crawl('https://github.com/b-fuze/deno-dom/blob/master/README.md').catch(
  console.error,
)
