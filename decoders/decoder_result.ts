export class DecoderSuccess<T> {
  constructor(readonly value: T) {}
}

export class DecoderError extends Error {
  readonly name = 'DecoderError';
  readonly location: string;
  readonly child?: DecoderError;
  readonly key?: unknown;

  constructor(
    readonly value: unknown,
    readonly message: string,
    options: {
      location?: string,  
      child?: DecoderError,
      key?: unknown,
    } = {}
  ) {
    super(message);
    this.location = options.location || '';
    this.child = options.child;
    this.key = options.key;
  }

  path(): unknown[] {    
    if (this.child === undefined && this.key === undefined) return [];
    if (this.key === undefined) return this.child.path();

    return [this.key, ...this.child.path()];
  }
}

// const test = {
//   one: 'one',
//   two: 'two',
//   contactLists: [
//     {
//       people: [
//         {
//           test: 'one',
//           colors: [
//             'one',
//             'two',
//             0
//           ]
//         }
//       ]
//     }
//   ]
// };

'contactLists';

// "contactList[0].people[0].colors" > "must be an array of strings";
// "contactList[0].people[0].get('colors')" > "must be an array of strings";

// "contactList[0].people[0].colors[3]" > "must be a string";

// ['contactLists', 0, 'people', 0, 'colors', 3];

// const person = {
//   person: {
//     addresses: [
//       {
//         street: '',
//         city: '',
//       }
//      ]
//   }
// }

export type DecoderResult<T> = DecoderSuccess<T> | DecoderError;
