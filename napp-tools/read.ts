import { nappSchema } from './nappSchema.ts'

export const readNappConfig = async (name: string) => {
  try {
    const imported = await import(name + '/napp.json', {
      with: { type: 'json' },
    })
    return nappSchema.parse(imported.default)
  } catch (error) {
    if (error instanceof Error) {
      const msg = 'napp.json not imported from package: ' + name + ':\n' +
        error.message
      throw new Error(msg)
    }
    throw error
  }
}
