export enum AnimalKind {
  Tiger = "Tiger",
  Elephant = "Elephant",
  RedPanda = "Red Panda",
  Monkey = "Monkey",
  Hippo = "Hippo",
}

export type Animal = {
  name: string;
  kind: AnimalKind;
};

export type Zoo = {
  name: string;
  entryFee: number;
  animals: Animal[];
};
