import graphviz from 'node-graphviz'

type Dep = {
    name: string
    set: Set<string>
}

const deps: Record<string, Dep> = {}

// Find all markdown files in directory
async function findMarkdownFiles(dir: URL): Promise<string[]> {
    const files: string[] = []
    for await (const entry of Deno.readDir(dir)) {
        if (entry.isFile && entry.name.endsWith('.md')) {
            files.push(dir + '/' + entry.name)
        }
    }
    return files
}

// Extract markdown links from content
function extractMarkdownLinks(content: string): Set<string> {
    const links = new Set<string>()
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    let match

    while ((match = linkRegex.exec(content)) !== null) {
        const link = match[2]
        if (link.endsWith('.md')) {
            links.add(link.replace('.md', ''))
        }
    }
    return links
}

async function check(fileName: string): Promise<Dep> {
    const deps = new Set<string>()
    console.log(`Checking ${fileName}`)
    const content = await Deno.readTextFile(new URL(fileName, import.meta.url))
    const links = extractMarkdownLinks(content)

    for (const link of links) {
        deps.add(link)
    }
    deps.delete(fileName.replace('.md', ''))
    return { name: fileName.replace('.md', ''), set: deps }
}

// Find circular dependencies
function checkCircularDeps(
    file: string,
    ancestors: string[] = [],
    seen: Set<string> = new Set(),
): string[] | undefined {
    const currentDeps = [...ancestors, file]
    if (ancestors.includes(file)) {
        return currentDeps
    }
    const d = deps[file]
    if (!d) {
        return
    }
    for (const dep of d.set) {
        const res = checkCircularDeps(dep, currentDeps, seen)
        if (res) {
            return res
        }
    }
}

// Main execution
async function main() {
    const url = new URL(import.meta.url)
    const root = url.href.substring(0, url.href.lastIndexOf('.github/graph.ts'))

    console.log('Current file directory:', root)
    const dir = new URL(root + 'gold-definitions', import.meta.url)
    const markdownFiles = await findMarkdownFiles(dir)

    // Build dependency graph
    for (const file of markdownFiles) {
        deps[file] = await check(file)
    }

    console.log(`${Object.keys(deps).length} markdown files checked.`)
    for (const file of Object.keys(deps)) {
        const res = checkCircularDeps(file)
        if (res) {
            console.log(`Circular dependencies found: ${res.join(' -> ')}`)
            Deno.exit(1)
        }
    }
    console.log('No circular dependencies found between markdown files.')

    const lines = []
    lines.push('digraph markdown_deps {')
    for (const file of Object.keys(deps)) {
        const info = deps[file]!
        const label = stripLabel(file)
        if (!label) {
            console.log(`No label found for ${file}`)
            Deno.exit(1)
        }
        console.log(`Label: ${label}`)
        lines.push(
            `  "${label}" [shape=circle fixedsize=1 height=1];`,
        )
        for (const dep of info.set) {
            const depLabel = stripLabel(dep)
            if (!depLabel) {
                console.log(`No label found for ${dep}`)
                Deno.exit(1)
            }
            lines.push(`  "${label}" -> "${depLabel}";`)
        }
    }

    lines.push('}')
    const graph = lines.join('\n')
    console.log(graph)
    const svg = await graphviz.graphviz.fdp(graph, 'svg')
    console.log(
        'Writing dependency graph image to .github/markdown_dependency_graph.svg',
    )

    await Deno.writeTextFile('.github/markdown_dependency_graph.svg', svg)
}

const stripLabel = (label: string) => {
    const last = label.lastIndexOf('/')
    return label.substring(last + 1).replace('.md', '')
}

await main()
