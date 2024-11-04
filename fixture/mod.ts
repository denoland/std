export const ping = () => {
  console.log('ping')
}

export type NappTypes = {
  ping: typeof ping
}
