# Sound effects for the logo styles, synthesised in code (no downloads, no licences).
# Stereo 48 kHz, with reverb and left/right movement. Written to public/sfx/<name>.wav
# Usage: uv run --no-project --with numpy python scripts/sfx.py
import wave
from pathlib import Path

import numpy as np

SR = 48000
OUT = Path(__file__).resolve().parent.parent / "public" / "sfx"
rng = np.random.default_rng(11)


def T(d):
    return np.arange(int(SR * d)) / SR


def n_(d):
    return int(SR * d)


def white(d, seed=None):
    g = np.random.default_rng(seed) if seed is not None else rng
    return g.standard_normal(n_(d))


def pink(d, seed=None):
    x = white(d, seed)
    X = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    X[1:] /= np.sqrt(fr[1:])
    X[0] = 0
    y = np.fft.irfft(X, len(x))
    return y / (np.std(y) + 1e-9)


def band(x, lo=0, hi=SR / 2, soft=1.4):
    """A fixed FFT filter with soft edges."""
    X = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1 / SR) + 1e-9
    m = np.ones_like(fr)
    if lo > 0:
        m *= 1 / (1 + (lo / fr) ** (2 * soft))
    if hi < SR / 2:
        m *= 1 / (1 + (fr / hi) ** (2 * soft))
    return np.fft.irfft(X * m, len(x))


def sweep(x, lo_curve, hi_curve, win=1024, hop=256):
    """A filter that moves over time (STFT): lo/hi are curves as long as the sound."""
    n = len(x)
    pad = np.concatenate([np.zeros(win), x, np.zeros(win)])
    w = np.hanning(win)
    out = np.zeros_like(pad)
    norm = np.zeros_like(pad)
    fr = np.fft.rfftfreq(win, 1 / SR) + 1e-9
    for s in range(0, len(pad) - win, hop):
        c = min(n - 1, max(0, s - win + win // 2))
        lo, hi = lo_curve[c], hi_curve[c]
        seg = pad[s : s + win] * w
        X = np.fft.rfft(seg)
        m = np.ones_like(fr)
        if lo > 0:
            m *= 1 / (1 + (lo / fr) ** 3)
        m *= 1 / (1 + (fr / hi) ** 3)
        out[s : s + win] += np.fft.irfft(X * m, win) * w
        norm[s : s + win] += w * w
    out /= np.maximum(norm, 1e-6)
    return out[win : win + n]


def tone(freq, d, shape="sine"):
    f = np.full(n_(d), freq) if np.isscalar(freq) else np.interp(np.linspace(0, 1, n_(d)), np.linspace(0, 1, len(freq)), freq)
    ph = 2 * np.pi * np.cumsum(f) / SR
    if shape == "sine":
        return np.sin(ph)
    if shape == "tri":
        return 2 / np.pi * np.arcsin(np.sin(ph))
    if shape == "saw":
        return 2 * ((ph / (2 * np.pi)) % 1) - 1
    if shape == "square":
        return np.sign(np.sin(ph))


def env(d, a=0.003, r=0.2, curve=5.0, hold=0.0):
    t = T(d)
    att = np.clip(t / max(a, 1e-4), 0, 1)
    rel = np.where(t < a + hold, 1.0, np.exp(-curve * (t - a - hold) / max(r, 1e-4)))
    return att * rel


def adsr(d, a, s_level, r):
    t = T(d)
    e = np.ones_like(t) * s_level
    e[t < a] = t[t < a] / a
    rel_start = d - r
    m = t > rel_start
    e[m] = s_level * (1 - (t[m] - rel_start) / r)
    return np.clip(e, 0, 1)


def bell(freq, d, decay=1.2, partials=((1, 1), (2.76, 0.45), (5.4, 0.25), (8.93, 0.12))):
    t = T(d)
    y = np.zeros_like(t)
    for ratio, amp in partials:
        y += amp * np.sin(2 * np.pi * freq * ratio * t) * np.exp(-t * (1.5 + ratio) / decay)
    return y * np.clip(t / 0.002, 0, 1)


def fade(x, fi=0.004, fo=0.03):
    x = x.copy()
    a, b = int(SR * fi), int(SR * fo)
    if a:
        x[:a] *= np.linspace(0, 1, a)
    if b:
        x[-b:] *= np.linspace(1, 0, b)
    return x


def pad_to(x, d):
    n = n_(d)
    return np.pad(x, (0, max(0, n - len(x))))[:n]


def place(buf, x, at):
    s = int(SR * at)
    e = min(len(buf), s + len(x))
    buf[s:e] += x[: e - s]
    return buf


def stereo(x, pan=0.0):
    """pan from -1 (left) to 1 (right), a number or a curve."""
    pan = np.full(len(x), pan) if np.isscalar(pan) else pan
    a = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], axis=1)


def widen(st, amt=0.25, delay_ms=9):
    d = int(SR * delay_ms / 1000)
    L, R = st[:, 0].copy(), st[:, 1].copy()
    R2 = np.concatenate([np.zeros(d), R[:-d]]) if d else R
    return np.stack([L * (1 - amt) + R2 * amt, R * (1 - amt) + L * amt], axis=1)


def reverb(st, size=1.6, mix=0.25, damp=5000, pre=0.012):
    """Convolution reverb with a synthetic response (fading noise), different in each ear."""
    n = n_(size)
    out = np.zeros((len(st) + n, 2))
    for ch in range(2):
        ir = white(size, seed=100 + ch) * np.exp(-6.5 * T(size) / size)
        ir = band(ir, 180, damp)
        ir = np.concatenate([np.zeros(int(SR * pre)), ir])
        ir /= np.sqrt(np.sum(ir**2)) + 1e-9
        L = len(st) + len(ir)
        y = np.fft.irfft(np.fft.rfft(st[:, ch], L) * np.fft.rfft(ir, L), L)[: len(out)]
        out[: len(y), ch] = y
    dry = np.zeros_like(out)
    dry[: len(st)] = st
    w = out * mix * 0.6
    return dry * (1 - mix * 0.35) + w


def sat(x, k=1.5):
    return np.tanh(k * x) / np.tanh(k)


def norm(st, peak_db=-3.0):
    p = np.max(np.abs(st)) + 1e-9
    return st / p * 10 ** (peak_db / 20)


def trim_tail(st, thresh_db=-70):
    a = np.max(np.abs(st), axis=1)
    idx = np.where(a > 10 ** (thresh_db / 20))[0]
    end = idx[-1] + int(SR * 0.05) if len(idx) else len(st)
    out = st[:end].copy()
    k = min(len(out), int(SR * 0.04))
    out[-k:] *= np.linspace(1, 0, k)[:, None]
    return out


# ---------------- the sounds ----------------
def whoosh(d=0.6, lo=250, hi=5200, pan=(-0.8, 0.8), peak=-7, rev=0.18, seed=1):
    x = pink(d, seed)
    shp = np.sin(np.linspace(0, np.pi, n_(d))) ** 1.6
    c = np.sin(np.linspace(0, np.pi, n_(d)))
    y = sweep(x, lo * (0.6 + 0.4 * c), lo + (hi - lo) * c)
    y += 0.25 * band(white(d, seed + 1), 3000, 9000) * shp ** 3
    st = stereo(fade(y * shp), np.linspace(pan[0], pan[1], n_(d)))
    return norm(reverb(widen(st), 0.9, rev), peak)


def make():
    S = {}
    S["whoosh"] = whoosh(0.55)
    S["whoosh_long"] = whoosh(1.1, 180, 3800, (0.9, -0.9), -8, 0.22, seed=3)
    S["whoosh_hi"] = whoosh(0.35, 900, 9000, (-0.5, 0.6), -10, 0.12, seed=5)
    # reverse swell (before the hit)
    d = 1.3
    t = T(d)
    e = (t / d) ** 3.2
    y = sweep(white(d, 7), 400 + 4000 * (t / d) ** 2, 1500 + 9000 * (t / d))
    y += 0.35 * band(pink(d, 8), 150, 1200) * e
    S["reverse"] = norm(reverb(widen(stereo(fade(y * e, 0.05, 0.004))), 0.6, 0.12), -8)
    # riser
    d = 2.2
    t = T(d)
    e = (t / d) ** 2.2
    y = sweep(white(d, 9), 200 + 1200 * t / d, 600 + 8500 * (t / d) ** 1.5) * e
    for k, base in enumerate((110, 164.8, 220)):
        y += 0.12 * band(tone(base * np.geomspace(1, 2.1, 200), d, "saw"), 80, 5000) * e
    S["riser"] = norm(reverb(widen(stereo(fade(y, 0.05, 0.01)), 0.4), 1.4, 0.2), -9)
    # cinematic hit
    d = 2.4
    sub = tone(np.geomspace(62, 31, 300), d) * env(d, 0.002, 0.9, 3.2)
    body = sat(tone(np.geomspace(150, 55, 300), d) * env(d, 0.001, 0.25, 5)) * 0.7
    crack = band(white(d, 12), 1200, 9000) * env(d, 0.0005, 0.05, 6) * 0.6
    boom = band(pink(d, 13), 40, 700) * env(d, 0.002, 0.6, 4) * 0.5
    y = sub + body + crack + boom
    S["impact"] = norm(trim_tail(reverb(widen(stereo(y), 0.15), 2.6, 0.32, 3500)), -1.5)
    d = 0.9
    y = tone(np.geomspace(130, 50, 120), d) * env(d, 0.002, 0.18, 5) + 0.25 * band(pink(d, 14), 200, 2500) * env(d, 0.001, 0.04, 6)
    S["hit"] = norm(trim_tail(reverb(stereo(sat(y, 1.2)), 1.2, 0.18)), -3)
    d = 1.8
    S["drop"] = norm(trim_tail(reverb(stereo(tone(np.geomspace(140, 30, 200), d) * env(d, 0.004, 0.8, 3)), 1.2, 0.15)), -3)
    # pop, tick and click
    for name, f0, f1, dd, pk in (("pop", 820, 260, 0.14, -6), ("pop_hi", 1500, 600, 0.1, -8), ("pop_lo", 420, 130, 0.18, -5)):
        y = tone(np.geomspace(f0, f1, 60), dd) * env(dd, 0.0008, 0.05, 5) + 0.12 * band(white(dd, 15), 2000, 8000) * env(dd, 0.0003, 0.01, 6)
        S[name] = norm(reverb(stereo(y), 0.5, 0.12), pk)
    d = 0.06
    S["tick"] = norm(stereo(band(white(d, 16), 2500, 10000) * env(d, 0.0004, 0.01, 6)), -9)
    d = 0.1
    S["click"] = norm(reverb(stereo((band(white(d, 17), 1500, 8000) * 0.6 + tone(2400, d) * 0.4) * env(d, 0.0004, 0.02, 6)), 0.4, 0.08), -7)
    d = 0.16
    S["snap"] = norm(reverb(stereo(band(white(d, 18), 900, 7000) * env(d, 0.0003, 0.03, 6) + 0.5 * tone(np.geomspace(1800, 700, 30), d) * env(d, 0.0005, 0.03, 6)), 0.5, 0.1), -5)
    # cartoon: boing and bounce
    d = 0.75
    t = T(d)
    f = 180 * (1 + 0.9 * np.exp(-t * 5)) * (1 + 0.08 * np.sin(2 * np.pi * 14 * t) * np.exp(-t * 3))
    S["boing"] = norm(reverb(stereo(tone(f, d, "tri") * env(d, 0.002, 0.3, 4)), 0.6, 0.12), -6)
    d = 0.35
    S["thud"] = norm(reverb(stereo(tone(np.geomspace(110, 45, 60), d) * env(d, 0.001, 0.08, 5) + 0.2 * band(pink(d, 19), 100, 900) * env(d, 0.001, 0.03, 6)), 0.6, 0.1), -4)
    d = 0.5
    t = T(d)
    S["stretch"] = norm(reverb(stereo(tone(np.geomspace(300, 900, 80), d, "tri") * env(d, 0.01, 0.2, 3) * 0.5), 0.5, 0.1), -12)
    # sparkle and shimmer
    d = 1.8
    buf = np.zeros((n_(d), 2))
    for k in range(14):
        at = rng.uniform(0, 0.9)
        fr = rng.choice([2093, 2349, 2637, 3136, 3520, 4186, 4699])
        b = bell(fr, 0.9, 0.35) * rng.uniform(0.3, 1.0)
        st = stereo(b, rng.uniform(-0.9, 0.9))
        s = int(SR * at)
        buf[s : s + len(st)] += st[: len(buf) - s]
    S["sparkle"] = norm(reverb(buf, 2.0, 0.35, 9000), -12)
    d = 1.6
    buf = np.zeros((n_(d), 2))
    for k, fr in enumerate((1568, 1976, 2349, 2637, 3136, 3951, 4699, 5274)):
        st = stereo(bell(fr, 1.2, 0.5) * (0.6 + 0.05 * k), -0.7 + 0.2 * k)
        s = int(SR * k * 0.07)
        buf[s : s + len(st)] += st[: len(buf) - s]
    S["shimmer"] = norm(reverb(buf, 2.2, 0.4, 9000), -12)
    # logo tone: a warm chord + a bell
    d = 3.2
    buf = np.zeros(n_(d))
    for k, fr in enumerate((523.25, 659.25, 783.99, 1046.5)):
        buf += 0.5 * bell(fr, d, 1.8, ((1, 1), (2, 0.25), (3.01, 0.12))) * (1 - 0.1 * k)
    padc = sum(tone(fr, d, "tri") for fr in (261.63, 329.63, 392.0)) / 3
    buf += 0.25 * band(padc, 100, 2500) * adsr(d, 0.25, 0.7, 1.8)
    S["chime"] = norm(trim_tail(reverb(widen(stereo(buf), 0.3), 3.0, 0.38, 7000)), -6)
    d = 2.8
    padc = sum(tone(fr * np.linspace(1, 1.003, 20), d, "saw") for fr in (130.81, 196.0, 261.63, 329.63)) / 4
    S["swell"] = norm(reverb(widen(stereo(band(padc, 80, 1800) * adsr(d, 1.6, 1.0, 0.8))), 2.5, 0.35, 4000), -12)
    # pen and drawing
    d = 1.6
    t = T(d)
    am = 0.55 + 0.45 * np.abs(np.sin(2 * np.pi * 7 * t + np.sin(2 * np.pi * 1.3 * t)))
    y = band(white(d, 21), 1800, 7000) * am + 0.3 * band(white(d, 22), 400, 1500) * am
    S["pen"] = norm(stereo(fade(y, 0.03, 0.08)), -20)
    d = 1.0
    t = T(d)
    S["marker"] = norm(stereo(fade(band(white(d, 23), 1200, 5200) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 4 * t))), 0.02, 0.06)), -19)
    # liquid and bubbles
    d = 2.4
    t = T(d)
    gurgle = band(pink(d, 24), 150, 1400) * (0.6 + 0.4 * np.sin(2 * np.pi * 6 * t + 2 * np.sin(2 * np.pi * 0.7 * t)))
    y = gurgle * adsr(d, 0.25, 1.0, 0.6) * 0.8
    for k in range(18):
        at = rng.uniform(0.1, d - 0.2)
        fr0 = rng.uniform(500, 1400)
        bb = tone(np.geomspace(fr0, fr0 * 1.9, 30), 0.05) * env(0.05, 0.002, 0.02, 4) * rng.uniform(0.2, 0.5)
        y = place(y, bb, at)
    S["liquid"] = norm(reverb(widen(stereo(y)), 1.0, 0.18), -9)
    d = 1.0
    y = np.zeros(n_(d))
    for k in range(10):
        fr0 = rng.uniform(600, 1600)
        y = place(y, tone(np.geomspace(fr0, fr0 * 2.2, 30), 0.045) * env(0.045, 0.002, 0.018, 4) * rng.uniform(0.4, 1), rng.uniform(0, 0.85))
    S["bubbles"] = norm(reverb(stereo(y, 0.1), 0.7, 0.15), -11)
    # digital: glitch and zap
    for name, d, parts, pk in (("glitch", 0.7, 9, -9), ("glitch_short", 0.22, 3, -10)):
        buf = np.zeros((n_(d), 2))
        for k in range(parts):
            m = rng.uniform(0.018, 0.06)
            sq = tone(rng.uniform(150, 1800), m, "square") * 0.45
            nz = band(white(m, 30 + k), 800, 9000)
            seg = (sq + nz) * env(m, 0.0005, m * 0.8, 2)
            seg = np.round(seg * 6) / 6
            st = stereo(seg, rng.choice([-0.8, 0.0, 0.8]))
            s = int(SR * rng.uniform(0, d - m))
            buf[s : s + len(st)] += st[: len(buf) - s]
        S[name] = norm(buf, pk)
    d = 0.45
    t = T(d)
    fm = np.sin(2 * np.pi * 900 * t + 6 * np.sin(2 * np.pi * 83 * t))
    S["zap"] = norm(reverb(stereo((fm * 0.6 + band(white(d, 31), 2000, 9000) * 0.5) * env(d, 0.001, 0.12, 4)), 0.6, 0.12), -9)
    # neon: flicker on and hum
    d = 1.4
    t = T(d)
    hum = sum(a * np.sin(2 * np.pi * h * 60 * t) for h, a in ((2, 1), (4, 0.45), (6, 0.3), (8, 0.15), (10, 0.08)))
    flick = np.zeros_like(t)
    for a, b in ((0.0, 0.05), (0.12, 0.16), (0.22, 0.24), (0.33, 0.5), (0.58, d)):
        flick[(t >= a) & (t < b)] = 1
    flick = band(flick, 0, 300)
    clicks = np.zeros_like(t)
    for a in (0.0, 0.12, 0.22, 0.33, 0.58):
        clicks = place(clicks, band(white(0.02, 40), 1500, 8000) * env(0.02, 0.0003, 0.008, 6), a)
    S["neon_on"] = norm(reverb(stereo(sat(hum * 0.5 * flick + clicks * 0.8, 1.3)), 0.8, 0.12), -10)
    d = 4.0
    t = T(d)
    hum = sum(a * np.sin(2 * np.pi * h * 60 * t) for h, a in ((2, 1), (4, 0.4), (6, 0.25), (8, 0.12)))
    S["neon_hum"] = norm(stereo(fade(hum * (0.9 + 0.1 * np.sin(2 * np.pi * 0.5 * t)), 0.3, 0.6)), -24)
    # swirling particles
    d = 2.4
    t = T(d)
    c = 0.5 - 0.5 * np.cos(np.linspace(0, 2 * np.pi, n_(d)))
    y = sweep(pink(d, 41), 600 + 1500 * c, 2000 + 6000 * c) * (0.3 + 0.7 * np.sin(np.linspace(0, np.pi, n_(d))))
    buf = stereo(y, 0.85 * np.sin(2 * np.pi * 0.9 * t))
    sp = S["sparkle"]
    buf[: min(len(buf), len(sp))] += 0.4 * sp[: len(buf)]
    S["swirl"] = norm(reverb(buf, 1.6, 0.3, 8000), -10)
    d = 1.6
    sw = whoosh(1.0, 400, 7000, (-0.7, 0.7), -6, 0.1, seed=42)
    buf = np.zeros((n_(d), 2))
    buf[: len(sw)] += sw[: len(buf)]
    sp = S["shimmer"]
    s = int(SR * 0.45)
    buf[s : s + len(sp)] += 0.7 * sp[: len(buf) - s]
    S["magic"] = norm(reverb(buf, 1.8, 0.25, 9000), -8)
    # flip and spin
    d = 0.7
    t = T(d)
    y = sweep(pink(d, 43), 300 + 0 * t, 1200 + 4000 * np.sin(np.linspace(0, np.pi, n_(d)))) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 9 * t))) * np.sin(np.linspace(0, np.pi, n_(d)))
    S["spin"] = norm(reverb(stereo(y, np.linspace(-0.6, 0.6, n_(d))), 0.7, 0.15), -9)
    d = 0.3
    S["flap"] = norm(reverb(stereo(band(white(d, 44), 500, 5000) * env(d, 0.002, 0.06, 5)), 0.4, 0.1), -9)
    d = 0.6
    S["slide"] = norm(stereo(fade(sweep(pink(d, 45), 200 + 0 * T(d), 900 + 2500 * np.sin(np.linspace(0, np.pi, n_(d)))) * np.sin(np.linspace(0, np.pi, n_(d))) ** 2, 0.01, 0.05), np.linspace(0.6, -0.6, n_(d))), -12)
    # keyboard typing
    d = 0.8
    y = np.zeros(n_(d))
    for k in range(10):
        m = 0.03
        y = place(y, band(white(m, 50 + k), 1800, 8000) * env(m, 0.0004, 0.01, 6) * rng.uniform(0.6, 1), 0.02 + k * 0.07 + rng.uniform(-0.01, 0.01))
    S["type"] = norm(stereo(y), -10)
    return S


def write(name, st):
    st = np.clip(st, -1, 1)
    pcm = (st * 32767).astype("<i2").tobytes()
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    S = make()
    for k, v in S.items():
        if v.ndim == 1:
            v = stereo(v)
        write(k, v)
        print(f"{k:13s} {len(v) / SR:5.2f}s")
    print(f"{len(S)} sounds → {OUT}")
