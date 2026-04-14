export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Wall {
  id: string;
  name: string;
  image_url: string;
  display_order: number;
}

export interface Point {
  x: number;
  y: number;
}

export type RoutePath = Point[];
export type RoutePathCollection = RoutePath[];
export type StoredRoutePath = RoutePath | RoutePathCollection;

export interface Route {
  id: string;
  wall_id: string;
  grade: string;
  color: string;
  name: string | null;
  setter: string | null;
  path: StoredRoutePath | null;
  region_x: number;
  region_y: number;
  region_w: number;
  region_h: number;
  active: boolean;
  created_at: string;
}

export type LogType = "flash" | "send" | "project";

export interface Log {
  id: string;
  user_id: string;
  route_id: string;
  log_type: LogType;
  created_at: string;
}

export interface RouteWithStatus extends Route {
  userLogType: LogType | null;
  userLogId: string | null;
}
