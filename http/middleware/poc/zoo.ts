export enum AnimalKind {
    Tiger    = 'Tiger',
    Elephant = 'Elephant',
    RedPanda = 'Red Panda',
    Monkey   = 'Monkey',
    Hippo    = 'Hippo',
}

export type Zoo = {
    name: string
    entryFee: number
    animals: {
        name: string
        kind: AnimalKind
    }[]
}

