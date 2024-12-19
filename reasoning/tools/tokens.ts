import {
    decode,
    decodeAsyncGenerator,
    decodeGenerator,
    encode,
    encodeChat,
    encodeGenerator,
    isWithinTokenLimit,
} from 'gpt-tokenizer/model/o1-preview'

async function findMarkdownFiles(dir: URL): Promise<string[]> {
    const files: string[] = []
    for await (const entry of Deno.readDir(dir)) {
        if (entry.isFile && entry.name.endsWith('.md')) {
            files.push(dir + '/' + entry.name)
        }
    }
    return files
}

const url = new URL(import.meta.url)
const root = url.href.substring(0, url.href.lastIndexOf('.github/tokens.ts'))

console.log('Current file directory:', root)
const dir = new URL(root + 'gold-definitions', import.meta.url)
const markdownFiles = await findMarkdownFiles(dir)

let totalTokens = 0

for (const file of markdownFiles) {
    const content = await Deno.readTextFile(new URL(file, import.meta.url))
    const tokens = await encode(content)
    const last = file.lastIndexOf('/')
    const name = file.replace('.md', '').substring(last + 1)
    console.log(`${name}: ${tokens.length} tokens`)
    totalTokens += tokens.length
}

console.log(`\nTotal tokens: ${totalTokens}\n`)
