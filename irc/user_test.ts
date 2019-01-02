import { Conn } from "deno";
import { assert, test } from "./package.ts";
import { User } from "./user.ts";

// 
test(function userModes() {
  // use empty object, as we're not testing connections here
  const user = new User({} as Conn);
  assert(!user.isInvisible);
  assert(!user.isOp);
  assert(!user.isLocalOp);
  assert(!user.isWallops);

  user.isInvisible = true;
  user.isOp = true;

  assert(user.isInvisible);
  assert(user.isOp);


  user.isInvisible = false;
  user.isOp = false;
  assert(!user.isInvisible);
  assert(!user.isOp);

  user.isLocalOp = true;
  user.isWallops = true;
  assert(user.isLocalOp);
  assert(user.isWallops);

  user.isLocalOp = false;
  user.isWallops = false;
  assert(!user.isLocalOp);
  assert(!user.isWallops);
});
