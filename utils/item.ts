import type { Database } from "@/utils/supabase_types.ts";

export type Item = Database["public"]["Tables"]["items"]["Row"];

export interface ItemWithCommentsCount extends Item {
  comments: [{ count: number }];
}
