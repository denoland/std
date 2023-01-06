// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import mysql from "npm:mysql2/promise";
import assert from "npm:assert";

async function main() {
  // create the connection to database
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "test",
  });

  await connection.execute(`DROP TABLE IF EXISTS pet;`);
  await connection.execute(
    `CREATE TABLE pet (name VARCHAR(20), species VARCHAR(20), age INT);`,
  );
  await connection.execute(
    `INSERT INTO pet (name, species, age) values
      ("Max", "dog", 3),
      ("Charlie", "dog", 2),
      ("Cooper", "dog", 1),
      ("Buddy", "dog", 4),
      ("Milo", "dog", 5),
      ("Bear", "dog", 1),
      ("Rocky", "dog", 4),
      ("Duke", "dog", 3),
      ("Tucker", "dog", 2),
      ("Jack", "dog", 9),
      ("Bella", "dog", 3),
      ("Luna", "dog", 4),
      ("Lucy", "dog", 3),
      ("Daisy", "dog", 1),
      ("Zoe", "dog", 2),
      ("Lily", "dog", 7),
      ("Lola", "dog", 11),
      ("Bailey", "dog", 8),
      ("Stella", "dog", 9),
      ("Molly", "dog", 3);
    `,
  );
  let results;
  [results] = await connection.query(
    'SELECT * FROM `pet` WHERE `name` = "Max" AND `age` > 1',
  );
  assert.deepStrictEqual(results, [
    { name: "Max", species: "dog", age: 3 },
  ]);
  [results] = await connection.query("SELECT * FROM `pet` WHERE `age` > 5");
  assert.deepStrictEqual(results, [
    { name: "Jack", species: "dog", age: 9 },
    { name: "Lily", species: "dog", age: 7 },
    { name: "Lola", species: "dog", age: 11 },
    { name: "Bailey", species: "dog", age: 8 },
    { name: "Stella", species: "dog", age: 9 },
  ]);
  [results] = await connection.query(
    "SELECT * FROM `pet` WHERE `name` = ? AND `age` > ?",
    ["Max", 1],
  );
  assert.deepStrictEqual(results, [
    { name: "Max", species: "dog", age: 3 },
  ]);
  connection.close();
}

main();
