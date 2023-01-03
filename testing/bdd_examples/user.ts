// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
export class User {
  static users: Map<string, User> = new Map();
  age?: number;

  constructor(public name: string) {
    if (User.users.has(name)) {
      throw new Deno.errors.AlreadyExists(`User ${name} already exists`);
    }
    User.users.set(name, this);
  }

  getAge(): number {
    if (!this.age) {
      throw new Error("Age unknown");
    }
    return this.age;
  }

  setAge(age: number) {
    this.age = age;
  }
}
