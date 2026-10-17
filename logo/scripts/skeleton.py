# Letter skeletons (the centre line of each stroke) for groups of logo parts. The pen in the
# handwriting style follows them, and morph / elastic / typing build the Arabic word from them.
# 1) Chrome draws the group black on white  2) Zhang-Suen thinning to a 1 px line
# 3) a graph of nodes and branches  4) pen order right-to-left (drawn branches, lifted returns)
# Writes src/skeleton.json (other groups already in it are kept).
#
#   uv run --no-project --with numpy --with pillow python scripts/skeleton.py --group word=p8 --group tag=p9-p24
#
# Part ids come from src/logo-data.json (npm run split). p9-p24 is a range; p3,p5,p7 is a list.
# Chrome: $CHROME, else Google Chrome / Chromium / Edge, else Remotion's chrome-headless-shell.
import argparse, glob, json, math, os, shutil, subprocess, tempfile
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / "src/logo-data.json").read_text())
P = {p["id"]: p for p in DATA["parts"]}
SC = 8  # pixels per logo unit (logos with a viewBox much larger than ~500 units: lower it)


def find_chrome():
    cands = [os.environ.get("CHROME")]
    cands += ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"]
    cands += [shutil.which(n) for n in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "chrome", "msedge")]
    cands += [r"C:\Program Files\Google\Chrome\Application\chrome.exe", r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"]
    cands += sorted(glob.glob(str(ROOT / "node_modules/.remotion/chrome-headless-shell/**/chrome-headless-shell*"), recursive=True))
    for c in cands:
        if c and os.path.isfile(c) and os.access(c, os.X_OK):
            return c
    raise SystemExit("No Chrome found. Set CHROME=/path/to/chrome, or run `npm run stills` once so Remotion downloads its browser.")


CHROME = find_chrome()


def parse_ids(spec):
    ids = []
    for tok in spec.split(","):
        tok = tok.strip()
        if "-" in tok:
            a, b = (int(t.strip().lstrip("p")) for t in tok.split("-"))
            ids += [f"p{i}" for i in range(a, b + 1)]
        elif tok:
            ids.append(tok if tok.startswith("p") else f"p{tok}")
    missing = [i for i in ids if i not in P]
    if missing:
        raise SystemExit(f"unknown parts {missing}: see npm run stills -- --id Parts 0")
    return ids


def render(ids, pad=4):
    xs = [P[i]["box"]["x"] for i in ids]
    ys = [P[i]["box"]["y"] for i in ids]
    x2 = [P[i]["box"]["x"] + P[i]["box"]["w"] for i in ids]
    y2 = [P[i]["box"]["y"] + P[i]["box"]["h"] for i in ids]
    bx, by = min(xs) - pad, min(ys) - pad
    bw, bh = max(x2) - bx + pad, max(y2) - by + pad
    W, H = int(math.ceil(bw * SC)), int(math.ceil(bh * SC))
    paths = "".join(f'<path d="{P[i]["d"]}"/>' for i in ids)
    html = f'<html><body style="margin:0;background:#fff"><svg width="{W}" height="{H}" viewBox="{bx} {by} {bw} {bh}" style="display:block"><g fill="#000">{paths}</g></svg></body></html>'
    tmp = Path(tempfile.mkdtemp())
    (tmp / "s.html").write_text(html)
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--user-data-dir={tmp}/prof", f"--window-size={W},{H}", "--force-device-scale-factor=1", f"--screenshot={tmp}/s.png", f"file://{tmp}/s.html"], capture_output=True)
    img = np.array(Image.open(tmp / "s.png").convert("L"))[:H, :W]
    return img < 128, bx, by


def thin(B):
    """Zhang-Suen: thin the shape to a 1 px line. Returns the skeleton and the number of passes (≈ half the thickness)."""
    I = np.pad(B.astype(np.uint8), 1)
    it = 0
    while True:
        changed = False
        for step in (0, 1):
            p2, p3, p4, p5 = I[:-2, 1:-1], I[:-2, 2:], I[1:-1, 2:], I[2:, 2:]
            p6, p7, p8, p9 = I[2:, 1:-1], I[2:, :-2], I[1:-1, :-2], I[:-2, :-2]
            c = I[1:-1, 1:-1]
            nb = [p2, p3, p4, p5, p6, p7, p8, p9]
            Bn = sum(x.astype(np.int32) for x in nb)
            seq = nb + [p2]
            A = sum(((seq[k] == 0) & (seq[k + 1] == 1)).astype(np.int32) for k in range(8))
            if step == 0:
                m = (p2 * p4 * p6 == 0) & (p4 * p6 * p8 == 0)
            else:
                m = (p2 * p4 * p8 == 0) & (p2 * p6 * p8 == 0)
            rm = (c == 1) & (Bn >= 2) & (Bn <= 6) & (A == 1) & m
            if rm.any():
                I[1:-1, 1:-1][rm] = 0
                changed = True
        it += 1
        if not changed:
            break
    return I[1:-1, 1:-1].astype(bool), it


NB8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
RING = [(-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1)]


def graph(S):
    """Skeleton -> branches. A node is an end (one branch out) or a junction (3+ branches); touching junction pixels are one node."""
    H, W = S.shape
    on = lambda y, x: 0 <= y < H and 0 <= x < W and S[y, x]
    pts = list(zip(*np.nonzero(S)))
    nbr = {p: [(p[0] + dy, p[1] + dx) for dy, dx in NB8 if on(p[0] + dy, p[1] + dx)] for p in pts}
    def cn(p):
        ring = [1 if on(p[0] + dy, p[1] + dx) else 0 for dy, dx in RING]
        return sum(1 for k in range(8) if ring[k] == 0 and ring[(k + 1) % 8] == 1)
    kind = {p: cn(p) for p in pts}
    node_px = {p for p in pts if kind[p] != 2}
    # cluster touching junction pixels
    cluster = {}
    cid = 0
    for p in node_px:
        if p in cluster:
            continue
        stack = [p]
        cluster[p] = cid
        while stack:
            q = stack.pop()
            for r in nbr[q]:
                if r in node_px and r not in cluster and kind[r] >= 3 and kind[q] >= 3:
                    cluster[r] = cid
                    stack.append(r)
        cid += 1
    centers = {}
    for p, c in cluster.items():
        centers.setdefault(c, []).append(p)
    center = {c: (sum(q[0] for q in v) / len(v), sum(q[1] for q in v) / len(v)) for c, v in centers.items()}
    visited = set()
    edges = []
    for p in node_px:
        for q in nbr[p]:
            if q in node_px:
                if cluster[q] != cluster[p] and cluster[p] < cluster[q]:
                    edges.append([center[cluster[p]], center[cluster[q]]])
                continue
            if q in visited:
                continue
            path = [center[cluster[p]], q]
            visited.add(q)
            prev, cur = p, q
            while True:
                cands = [r for r in nbr[cur] if r != prev and r not in visited]
                nodes = [r for r in cands if r in node_px and not (r in cluster and cluster.get(r) == cluster[p] and len(path) < 3)]
                if nodes:
                    path.append(center[cluster[nodes[0]]])
                    break
                cands = [r for r in cands if r not in node_px]
                if not cands:
                    break
                # direct neighbours first (not diagonal) so we never jump over a pixel
                cands.sort(key=lambda r: abs(r[0] - cur[0]) + abs(r[1] - cur[1]))
                r = cands[0]
                visited.add(r)
                path.append(r)
                prev, cur = cur, r
            edges.append(path)
    # closed loops with no nodes
    rest = [p for p in pts if p not in node_px and p not in visited]
    for st in rest:
        if st in visited:
            continue
        loop = [st]
        visited.add(st)
        prev, cur = None, st
        while True:
            cands = [r for r in nbr[cur] if r != prev and r not in visited and r not in node_px]
            if not cands:
                break
            cands.sort(key=lambda r: abs(r[0] - cur[0]) + abs(r[1] - cur[1]))
            prev, cur = cur, cands[0]
            visited.add(cur)
            loop.append(cur)
        if len(loop) > 8:
            loop.append(st)
            edges.append(loop)
    # clean up: an end point (a junction centre) far from its neighbour pixel -> use that pixel; drop zero-length branches
    clean = []
    for e in edges:
        if len(e) >= 2 and math.dist(e[0], e[1]) > 4:
            e = e[1:]
        if len(e) >= 2 and math.dist(e[-1], e[-2]) > 4:
            e = e[:-1]
        if len(e) >= 2 and length(e) >= 3:
            clean.append(e)
    return clean, kind


def snap(edges, tol=6):
    """Branch ends close to each other -> exactly the same point (so the drawing connects)."""
    reps = []
    def rp(p):
        for q in reps:
            if math.dist(p, q) <= tol:
                return q
        reps.append(p)
        return p
    return [[rp(e[0])] + e[1:-1] + [rp(e[-1])] for e in edges]


def join_deg2(edges):
    """A node with only two branches -> join them into one."""
    changed = True
    while changed:
        changed = False
        cnt = {}
        for i, e in enumerate(edges):
            for p in (e[0], e[-1]):
                cnt.setdefault(p, []).append(i)
        for p, lst in cnt.items():
            if len(lst) == 2 and lst[0] != lst[1]:
                a, b = edges[lst[0]], edges[lst[1]]
                if a[-1] != p:
                    a = a[::-1]
                if b[0] != p:
                    b = b[::-1]
                new = a + b[1:]
                edges = [e for k, e in enumerate(edges) if k not in lst] + [new]
                changed = True
                break
    return edges


def length(e):
    return sum(math.dist(e[i], e[i + 1]) for i in range(len(e) - 1))


def merge_nodes(edges, tol=2.5):
    """Nodes close to each other (a junction a few pixels wide) -> one node."""
    ends = [e[0] for e in edges] + [e[-1] for e in edges]
    rep = {}
    for p in ends:
        for q in list(rep.values()):
            if math.dist(p, q) <= tol:
                rep[p] = q
                break
        else:
            rep[p] = p
    out = []
    for e in edges:
        e = [rep[e[0]]] + e[1:-1] + [rep[e[-1]]]
        out.append(e)
    return out


def prune(edges, min_len):
    """Remove short spurs (branches with a free end shorter than min_len)."""
    for _ in range(4):
        cnt = {}
        for e in edges:
            for p in (e[0], e[-1]):
                cnt[p] = cnt.get(p, 0) + 1
        keep = []
        for e in edges:
            free = cnt[e[0]] == 1 or cnt[e[-1]] == 1
            if free and length(e) < min_len and not (cnt[e[0]] == 1 and cnt[e[-1]] == 1):
                continue
            keep.append(e)
        if len(keep) == len(edges):
            break
        edges = keep
    return edges


def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    if math.dist(pts[0], pts[-1]) < 1e-6:
        # closed loop: split it at the point farthest from the start
        k = max(range(len(pts)), key=lambda i: math.dist(pts[0], pts[i]))
        return rdp(pts[: k + 1], eps)[:-1] + rdp(pts[k:], eps)
    a, b = np.array(pts[0], float), np.array(pts[-1], float)
    ab = b - a
    L = np.hypot(*ab) or 1e-9
    d = [abs(ab[0] * (p[1] - a[1]) - ab[1] * (p[0] - a[0])) / L for p in pts[1:-1]]
    i = int(np.argmax(d)) + 1
    if d[i - 1] > eps:
        return rdp(pts[: i + 1], eps)[:-1] + rdp(pts[i:], eps)
    return [pts[0], pts[-1]]


def smooth(pts, n=2):
    for _ in range(n):
        if len(pts) < 3:
            return pts
        out = [pts[0]]
        for i in range(len(pts) - 1):
            p, q = np.array(pts[i]), np.array(pts[i + 1])
            out += [tuple(0.75 * p + 0.25 * q), tuple(0.25 * p + 0.75 * q)]
        out.append(pts[-1])
        pts = out
    return pts


def order(edges, tol=6):
    """Pen order: start at the far right; at each junction draw the branch that stays right first (a side branch or a loop); going back = pen lifted."""
    reps = []
    def nid(p):
        for k, q in enumerate(reps):
            if math.dist(p, q) <= tol:
                return k
        reps.append(p)
        return len(reps) - 1
    E = [(nid(e[0]), nid(e[-1]), e) for e in edges]
    adj = {}
    for i, (a, b, e) in enumerate(E):
        adj.setdefault(a, []).append((i, False))
        adj.setdefault(b, []).append((i, True))
    done = [False] * len(E)
    X = lambda k: reps[k][1]  # x in pixels (column)
    moves = []
    while not all(done):
        live = [k for k, lst in adj.items() if any(not done[i] for i, _ in lst)]
        ends = [k for k in live if len(adj[k]) == 1]
        # far right: a point on any branch not drawn yet
        best = max(range(len(E)), key=lambda i: -1 if done[i] else max(p[1] for p in E[i][2]))
        a, b, e = E[best]
        start = a if X(a) >= X(b) else b
        cand = [k for k in ends if X(k) >= max(p[1] for p in e) - 4]
        if cand:
            start = max(cand, key=X)
        if moves:
            moves.append({"lift": True, "jump": True, "pts": [moves[-1]["pts"][-1], reps[start]]})
        cur = start
        while True:
            opts = [(i, rev) for i, rev in adj[cur] if not done[i]]
            if opts:
                def score(o):
                    i, rev = o
                    a, b, e = E[i]
                    far = a if rev else b
                    loop = a == b
                    return (loop, X(far) - X(cur) > -6, X(far), -len(e))
                i, rev = max(opts, key=score)
                a, b, e = E[i]
                done[i] = True
                moves.append({"lift": False, "pts": e[::-1] if rev else e})
                cur = a if rev else b
                continue
            # no branches left here: shortest path (over drawn lines, pen lifted) to the nearest point with an undrawn branch
            import heapq
            dist = {cur: 0.0}
            prev = {}
            pq = [(0.0, cur)]
            target = None
            while pq:
                dcur, u = heapq.heappop(pq)
                if dcur > dist.get(u, 1e18):
                    continue
                if any(not done[i] for i, _ in adj[u]):
                    target = u
                    break
                for i, rev in adj[u]:
                    a, b, e = E[i]
                    v = a if rev else b
                    if v == u and a != b:
                        continue
                    w = dcur + length(e)
                    if w < dist.get(v, 1e18):
                        dist[v] = w
                        prev[v] = (u, i, rev)
                        heapq.heappush(pq, (w, v))
            if target is None:
                break
            path = []
            v = target
            while v != cur:
                u, i, rev = prev[v]
                e = E[i][2]
                path = (e[::-1] if rev else e) + path[1:] if path else (e[::-1] if rev else e)
                v = u
            if path:
                moves.append({"lift": True, "pts": path})
            cur = target
        while moves and moves[-1]["lift"] and not moves[-1].get("jump"):
            moves.pop()
    return moves




def build(name, ids):
    B, bx, by = render(ids)
    S, it = thin(B)
    half = it / SC  # about half the stroke thickness, in logo units
    edges, _ = graph(S)
    edges = snap(edges)
    edges = prune(edges, min_len=max(6, it * 1.4))
    edges = join_deg2(edges)
    moves = order(edges)
    out = []
    for m in moves:
        pts = [(c / SC + bx, r / SC + by) for r, c in m["pts"]]
        if not m["lift"]:
            pts = smooth(rdp(pts, 0.25), 2)
        else:
            pts = rdp(pts, 0.6)
        out.append({"lift": m["lift"], "jump": bool(m.get("jump")), "pts": [[round(x, 2), round(y, 2)] for x, y in pts]})
    total = sum(sum(math.dist(m["pts"][i], m["pts"][i + 1]) for i in range(len(m["pts"]) - 1)) for m in out if not m["lift"])
    print(f"{name}: {len(edges)} branches, {len(out)} moves, drawn length {total:.0f}, half-thickness ≈ {half:.2f}")
    return {"half": round(half, 2), "parts": ids, "moves": out}


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--group", action="append", required=True, help="name=p8 or name=p9-p24 or name=p3,p5")
    a = ap.parse_args()
    path = ROOT / "src/skeleton.json"
    res = json.loads(path.read_text()) if path.exists() else {}
    for g in a.group:
        name, spec = g.split("=", 1)
        res[name.strip()] = build(name.strip(), parse_ids(spec))
    path.write_text(json.dumps(res))
    print("→ src/skeleton.json  (check it: npm run stills -- --id Skeleton 0)")
