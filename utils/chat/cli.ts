import { program } from 'commander'
import { main } from './mod.ts'

program
  .name('@dreamcatcher/chat')
  .description(
    'Extract and reconstruct a shared AI conversation from a given URL.',
  )
  .argument('<url>', 'The shared conversation URL')
  .option('-o, --output <filename>', 'Specify an output filename')
  .action(async (url: string, options: { output?: string }) => {
    try {
      await main(url, options.output)
    } catch (e) {
      console.error(e)
      Deno.exit(1)
    }
  })

// Note the second parameter:
program.parse(Deno.args, { from: 'user' })
