export interface Env {
  BOT_TOKEN: string;
  OWNER_ID: string;
  DB_PATH: string;
}

export interface ButtonInput {
  label: string;
  url: string;
}

export interface Destination {
  id: number;
  chat_id: string;
  title: string;
  type: "channel" | "group";
  added_at: number;
}

export interface PostRecord {
  id: number;
  label: string;
  text: string;
  created_at: number;
}

export interface ScheduledPost {
  id: number;
  text: string;
  buttons_json: string | null;
  destinations: string; // JSON string array of chat ids
  publish_at: number;
  status: "pending" | "published" | "failed";
  created_at: number;
}

export interface UserRecord {
  user_id: string;
  username: string | null;
  status: "pending" | "approved" | "declined";
  requested_at: number;
  decided_at: number | null;
}

export interface UserState {
  user_id: string;
  step: string;
  data_json: string;
  updated_at: number;
}

// Multi-step owner workflows tracked in user_state.step
export type OwnerStep =
  | "idle"
  | "compose_post_text"
  | "compose_post_button_label"
  | "compose_post_button_url"
  | "compose_post_pick_destinations"
  | "add_destination_wait_forward"
  | "schedule_pick_time"
  | "edit_button_pick_post"
  | "edit_button_pick_button"
  | "edit_button_new_url";
