Game.Pathfinding = (function () {

  // Point-in-polygon using ray casting
  function pointInPolygon(px, py, polygon) {
    var inside = false;
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      var xi = polygon[i][0], yi = polygon[i][1];
      var xj = polygon[j][0], yj = polygon[j][1];
      var intersect = ((yi > py) !== (yj > py)) &&
        (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // Clamp a point to the nearest point on a polygon edge
  function clampToPolygon(px, py, polygon) {
    if (pointInPolygon(px, py, polygon)) return { x: px, y: py };

    var bestDist = Infinity;
    var bestX = px, bestY = py;

    for (var i = 0; i < polygon.length; i++) {
      var j = (i + 1) % polygon.length;
      var cp = closestPointOnSegment(px, py,
        polygon[i][0], polygon[i][1],
        polygon[j][0], polygon[j][1]);
      var d = dist(px, py, cp.x, cp.y);
      if (d < bestDist) {
        bestDist = d;
        bestX = cp.x;
        bestY = cp.y;
      }
    }
    return { x: bestX, y: bestY };
  }

  function closestPointOnSegment(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay;
    var len2 = dx * dx + dy * dy;
    if (len2 === 0) return { x: ax, y: ay };
    var t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
    return { x: ax + t * dx, y: ay + t * dy };
  }

  function dist(x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Check if line segment AB intersects polygon edge (excluding endpoints)
  function segmentIntersectsEdge(ax, ay, bx, by, cx, cy, dx, dy) {
    function cross(ox, oy, px, py, qx, qy) {
      return (px - ox) * (qy - oy) - (py - oy) * (qx - ox);
    }
    var d1 = cross(cx, cy, dx, dy, ax, ay);
    var d2 = cross(cx, cy, dx, dy, bx, by);
    var d3 = cross(ax, ay, bx, by, cx, cy);
    var d4 = cross(ax, ay, bx, by, dx, dy);

    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
      return true;
    }
    return false;
  }

  // Check if we can walk in a straight line between two points inside the polygon
  function lineOfSight(ax, ay, bx, by, polygon) {
    // Check midpoint is inside
    var mx = (ax + bx) / 2, my = (ay + by) / 2;
    if (!pointInPolygon(mx, my, polygon)) return false;

    // Check no polygon edge is crossed
    for (var i = 0; i < polygon.length; i++) {
      var j = (i + 1) % polygon.length;
      if (segmentIntersectsEdge(ax, ay, bx, by,
        polygon[i][0], polygon[i][1],
        polygon[j][0], polygon[j][1])) {
        return false;
      }
    }
    return true;
  }

  // Simple visibility-graph pathfinding using polygon vertices
  function findPath(sx, sy, ex, ey, polygon) {
    // Direct line?
    if (lineOfSight(sx, sy, ex, ey, polygon)) {
      return [{ x: ex, y: ey }];
    }

    // Build node list: start, end, + all polygon vertices inside polygon
    var nodes = [{ x: sx, y: sy }, { x: ex, y: ey }];
    for (var i = 0; i < polygon.length; i++) {
      // Offset vertices slightly inward
      var prev = polygon[(i - 1 + polygon.length) % polygon.length];
      var curr = polygon[i];
      var next = polygon[(i + 1) % polygon.length];
      var nx = (prev[0] + curr[0] + next[0]) / 3;
      var ny = (prev[1] + curr[1] + next[1]) / 3;
      var offX = curr[0] + (nx - curr[0]) * 0.1;
      var offY = curr[1] + (ny - curr[1]) * 0.1;
      if (pointInPolygon(offX, offY, polygon)) {
        nodes.push({ x: offX, y: offY });
      }
    }

    // Build adjacency
    var n = nodes.length;
    var adj = [];
    for (var a = 0; a < n; a++) {
      adj[a] = [];
      for (var b = 0; b < n; b++) {
        if (a === b) continue;
        if (lineOfSight(nodes[a].x, nodes[a].y, nodes[b].x, nodes[b].y, polygon)) {
          adj[a].push({ to: b, cost: dist(nodes[a].x, nodes[a].y, nodes[b].x, nodes[b].y) });
        }
      }
    }

    // Dijkstra from node 0 (start) to node 1 (end)
    var INF = 1e18;
    var distArr = new Array(n).fill(INF);
    var prev = new Array(n).fill(-1);
    var visited = new Array(n).fill(false);
    distArr[0] = 0;

    for (var step = 0; step < n; step++) {
      var u = -1;
      for (var v = 0; v < n; v++) {
        if (!visited[v] && (u === -1 || distArr[v] < distArr[u])) u = v;
      }
      if (u === -1 || distArr[u] === INF) break;
      visited[u] = true;

      for (var e = 0; e < adj[u].length; e++) {
        var edge = adj[u][e];
        var nd = distArr[u] + edge.cost;
        if (nd < distArr[edge.to]) {
          distArr[edge.to] = nd;
          prev[edge.to] = u;
        }
      }
    }

    if (distArr[1] === INF) {
      // No path found, just walk directly
      return [{ x: ex, y: ey }];
    }

    // Reconstruct
    var path = [];
    for (var at = 1; at !== -1; at = prev[at]) {
      path.push({ x: nodes[at].x, y: nodes[at].y });
    }
    path.reverse();
    path.shift(); // remove start
    return path;
  }

  return {
    pointInPolygon: pointInPolygon,
    clampToPolygon: clampToPolygon,
    findPath: findPath,
    dist: dist,
  };
})();
