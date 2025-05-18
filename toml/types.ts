export type TOMLTable = {[Key in string]: TOMLValue} & {[Key in string]: TOMLValue|undefined};
export type TOMLArray = TOMLValue[] | readonly TOMLValue[];
export type TOMLPrimitive = string | number | boolean | Date;
export type TOMLValue = TOMLPrimitive | TOMLArray | TOMLTable;
