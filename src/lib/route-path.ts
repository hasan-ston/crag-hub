import type { Point, Route, RoutePath } from "@/lib/types";

const MAX_POINTS = 40;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function perpendicularDistance(point: Point, start: Point, end: Point) {
  const length = distance(start, end);

  if (length === 0) {
    return distance(point, start);
  }

  const area = Math.abs(
    (start.x * end.y + end.x * point.y + point.x * start.y) -
      (start.y * end.x + end.y * point.x + point.y * start.x)
  );

  return area / length;
}

function douglasPeucker(points: RoutePath, epsilon: number): RoutePath {
  if (points.length <= 2) {
    return points;
  }

  let maxDistance = 0;
  let index = 0;
  const endIndex = points.length - 1;

  for (let i = 1; i < endIndex; i += 1) {
    const pointDistance = perpendicularDistance(points[i], points[0], points[endIndex]);
    if (pointDistance > maxDistance) {
      maxDistance = pointDistance;
      index = i;
    }
  }

  if (maxDistance <= epsilon) {
    return [points[0], points[endIndex]];
  }

  const left = douglasPeucker(points.slice(0, index + 1), epsilon);
  const right = douglasPeucker(points.slice(index), epsilon);
  return [...left.slice(0, -1), ...right];
}

function evenlySample(points: RoutePath, maxPoints = MAX_POINTS): RoutePath {
  if (points.length <= maxPoints) {
    return points;
  }

  const sampled: RoutePath = [];

  for (let i = 0; i < maxPoints; i += 1) {
    const index = Math.round((i * (points.length - 1)) / (maxPoints - 1));
    sampled.push(points[index]);
  }

  return sampled;
}

export function sanitizeRoutePath(points: RoutePath): RoutePath {
  return points.map((point) => ({
    x: clamp01(point.x),
    y: clamp01(point.y),
  }));
}

export function simplifyRoutePath(points: RoutePath, maxPoints = MAX_POINTS): RoutePath {
  if (points.length <= 2) {
    return sanitizeRoutePath(points);
  }

  const sanitized = sanitizeRoutePath(points);
  let epsilon = 0.0025;
  let simplified = douglasPeucker(sanitized, epsilon);

  while (simplified.length > maxPoints && epsilon < 0.05) {
    epsilon *= 1.35;
    simplified = douglasPeucker(sanitized, epsilon);
  }

  return evenlySample(simplified, maxPoints);
}

export function getBoundingBoxFromPath(path: RoutePath) {
  const safePath = sanitizeRoutePath(path);
  const xs = safePath.map((point) => point.x);
  const ys = safePath.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    region_x: Math.max(0, Number((minX * 100).toFixed(2))),
    region_y: Math.max(0, Number((minY * 100).toFixed(2))),
    region_w: Number((Math.max(maxX - minX, 0.03) * 100).toFixed(2)),
    region_h: Number((Math.max(maxY - minY, 0.03) * 100).toFixed(2)),
  };
}

export function getRoutePathCentroid(path: RoutePath): Point {
  if (path.length === 0) {
    return { x: 0.5, y: 0.5 };
  }

  const safePath = sanitizeRoutePath(path);
  const sum = safePath.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
    }),
    { x: 0, y: 0 }
  );

  return {
    x: sum.x / safePath.length,
    y: sum.y / safePath.length,
  };
}

export function getFallbackPathFromRoute(route: Pick<Route, "region_x" | "region_y" | "region_w" | "region_h">): RoutePath {
  const left = clamp01(route.region_x / 100);
  const top = clamp01(route.region_y / 100);
  const right = clamp01((route.region_x + route.region_w) / 100);
  const bottom = clamp01((route.region_y + route.region_h) / 100);

  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ];
}

export function getRenderableRoutePath(route: Pick<Route, "path" | "region_x" | "region_y" | "region_w" | "region_h">): RoutePath {
  if (route.path && route.path.length >= 3) {
    return sanitizeRoutePath(route.path);
  }

  return getFallbackPathFromRoute(route);
}

export function routePathToSvgPoints(path: RoutePath) {
  return sanitizeRoutePath(path)
    .map((point) => `${(point.x * 100).toFixed(2)},${(point.y * 100).toFixed(2)}`)
    .join(" ");
}
