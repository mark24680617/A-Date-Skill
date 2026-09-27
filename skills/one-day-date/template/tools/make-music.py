#!/usr/bin/env python3
"""
生成网站的背景音乐（原创，可自由使用）：assets/audio/bgm.mp3
Renders the site's original background music: a gentle music-box piece in F major
that loops seamlessly.

    pip install numpy scipy
    python3 tools/make-music.py            # writes assets/audio/bgm.wav (+ bgm.mp3 if ffmpeg is found)

Form (84 BPM, 4/4, 32 bars ≈ 91 s):
    intro (4) → A melody (8) → B arpeggios (8) → A' melody + harmony (8) → outro (4, ends on C → loops to F)
"""
import os
import shutil
import subprocess
import sys

import numpy as np
from scipy.signal import fftconvolve

SR = 44100
BPM = 84
BEAT = 60.0 / BPM
BAR = 4 * BEAT
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'assets', 'audio')
rng = np.random.default_rng(20261001)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


# ---------------------------------------------------------------- harmony
# chord name -> (pad voicing, bass root, bass fifth)   (MIDI; bass kept high enough for phone speakers)
CHORDS = {
    'F':   ([65, 69, 72], 53, 60),
    'C/E': ([64, 67, 72], 52, 55),
    'Dm':  ([62, 65, 69], 50, 57),
    'Bb':  ([62, 65, 70], 46, 53),
    'Am':  ([64, 69, 72], 45, 52),
    'C':   ([64, 67, 70, 72], 48, 55),
    'Gm7': ([62, 65, 67, 70], 55, 50),
}
PROG = ['F', 'C/E', 'Dm', 'Bb', 'F', 'Am', 'Bb', 'C']

# melodies: list of bars, each a list of (midi, beats); None = rest
MEL_A = [
    [(81, 1), (84, .5), (81, .5), (79, 1), (77, 1)],
    [(76, 1.5), (79, .5), (84, 2)],
    [(86, 1), (84, .5), (81, .5), (77, 1), (81, 1)],
    [(77, .5), (79, .5), (77, 1), (74, 2)],
    [(81, 1), (84, .5), (81, .5), (79, 1), (77, 1)],
    [(76, 1), (81, 1), (84, 1), (81, 1)],
    [(86, 1.5), (84, .5), (82, 1), (79, 1)],
    [(79, 1), (81, .5), (79, .5), (76, 2)],
]
MEL_B = [
    [(n, .5) for n in (84, 81, 77, 81, 84, 86, 84, 81)],
    [(n, .5) for n in (79, 76, 72, 76, 79, 81, 79, 76)],
    [(n, .5) for n in (81, 77, 74, 77, 81, 84, 81, 77)],
    [(n, .5) for n in (77, 74, 70, 74, 77, 79, 77, 74)],
    [(84, 1), (86, 1), (89, 2)],
    [(88, 1), (84, 1), (81, 2)],
    [(86, 1), (84, 1), (82, 1), (86, 1)],
    [(84, 2), (79, 1), (76, 1)],
]
OUTRO = (['F', 'Bb', 'Gm7', 'C'], [
    [(84, 2), (81, 2)],
    [(82, 2), (86, 2)],
    [(86, 2), (82, 2)],
    [(79, 2), (76, 2)],
])

F_MAJOR = [65, 67, 69, 70, 72, 74, 76]  # F G A Bb C D E


SCALE_NOTES = [n for n in range(36, 100) if n % 12 in {p % 12 for p in F_MAJOR}]


def third_below(m):
    """Diatonic third below, staying in F major."""
    return SCALE_NOTES[SCALE_NOTES.index(m) - 2]


# ---------------------------------------------------------------- instruments
def env_ar(n, attack, release_at, release):
    t = np.arange(n) / SR
    e = np.clip(t / max(attack, 1e-4), 0, 1)
    rel = np.clip(1 - (t - release_at) / release, 0, 1)
    return e * np.where(t < release_at, 1.0, rel)


def music_box(m, vel):
    f = hz(m)
    n = int(2.6 * SR)
    t = np.arange(n) / SR
    tau = 0.95 * (523.0 / f) ** 0.35
    out = np.zeros(n)
    for ratio, amp, dk in ((1, 1.0, 1.0), (2, .26, .55), (3, .07, .4), (4.18, .05, .3), (5.95, .02, .22)):
        out += amp * np.sin(2 * np.pi * f * ratio * t + rng.uniform(0, 6.28)) * np.exp(-t / (tau * dk))
    out *= np.clip(t / 0.002, 0, 1)
    return out * vel * 0.30


def pad(notes, dur, vel):
    n = int((dur + 1.4) * SR)
    t = np.arange(n) / SR
    L = np.zeros(n)
    R = np.zeros(n)
    for m in notes:
        f = hz(m)
        a = np.sin(2 * np.pi * f * t) + 0.12 * np.sin(2 * np.pi * 2 * f * t)
        b = np.sin(2 * np.pi * f * 1.004 * t + 1.3) + 0.12 * np.sin(2 * np.pi * 2 * f * 1.004 * t)
        L += 0.62 * a + 0.38 * b
        R += 0.38 * a + 0.62 * b
    e = env_ar(n, 0.55, dur, 1.3) * (1 + 0.04 * np.sin(2 * np.pi * 0.25 * t))
    k = vel * 0.075
    return L * e * k, R * e * k


def bass(m, dur, vel):
    f = hz(m)
    n = int((dur + 0.4) * SR)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * 2 * f * t) + 0.16 * np.sin(2 * np.pi * 3 * f * t)
    e = np.exp(-t / 0.75) * env_ar(n, 0.006, dur, 0.25)
    return tone * e * vel * 0.16


def shaker(vel):
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    x = np.diff(np.concatenate([[0], x]))          # tilt towards high frequencies
    x = np.convolve(x, np.ones(3) / 3, 'same')      # take the harsh edge off
    return x * np.exp(-t / 0.028) * np.clip(t / 0.003, 0, 1) * vel * 0.11


# ---------------------------------------------------------------- arrangement
TOTAL_BARS = 32
LEN = int(round(TOTAL_BARS * BAR * SR))
TAIL = int(4.0 * SR)
buses = {k: np.zeros((2, LEN + TAIL)) for k in ('box', 'pad', 'bass', 'perc')}


def add(bus, sig, start_s, pan=0.0):
    i = int(round(start_s * SR))
    if isinstance(sig, tuple):
        L, R = sig
    else:
        L = sig * (1 - pan) ** 0.5
        R = sig * (1 + pan) ** 0.5
    n = min(len(L), buses[bus].shape[1] - i)
    buses[bus][0, i:i + n] += L[:n]
    buses[bus][1, i:i + n] += R[:n]


def play_melody(bars, start_bar, vel=1.0, pan=0.18, harmony=0.0):
    for b, notes in enumerate(bars):
        pos = (start_bar + b) * BAR
        for m, beats in notes:
            if m is not None:
                v = vel * (1.0 if round(pos / BEAT, 3) % 2 == 0 else 0.86)   # accent beats 1 and 3
                add('box', music_box(m, v), pos, pan)
                if harmony:
                    add('box', music_box(third_below(m), v * harmony), pos, -pan)
            pos += beats * BEAT


def comp(chords, start_bar, pad_vel=1.0, bass_style='whole', perc=False):
    for b, name in enumerate(chords):
        notes, root, fifth = CHORDS[name]
        t0 = (start_bar + b) * BAR
        add('pad', pad(notes, BAR * 0.98, pad_vel), t0)
        if bass_style == 'whole':
            add('bass', bass(root, BAR * 0.9, 0.8), t0)
        elif bass_style == 'walk':
            add('bass', bass(root, BEAT * 1.4, 1.0), t0)
            add('bass', bass(fifth, BEAT * 0.9, 0.75), t0 + 2 * BEAT)
            add('bass', bass(root, BEAT * 0.5, 0.6), t0 + 3.5 * BEAT)
        if perc:
            for k in range(8):
                v = 1.0 if k % 2 else 0.45
                add('perc', shaker(v), t0 + k * BEAT / 2 + rng.uniform(-0.006, 0.006), pan=0.35)


# intro: pad + sparse music-box arpeggio
comp(PROG[:4], 0, pad_vel=0.9)
for b, name in enumerate(PROG[:4]):
    notes = CHORDS[name][0]
    arp = [notes[-1] + 12, notes[1] + 12, notes[0] + 12, notes[1] + 12]
    for k, m in enumerate(arp):
        add('box', music_box(m, 0.5 if k else 0.6), (b * 4 + k) * BEAT, 0.25)

# A
comp(PROG, 4, pad_vel=0.8, bass_style='walk')
play_melody(MEL_A, 4)
# B
comp(PROG, 12, pad_vel=0.9, bass_style='walk', perc=True)
play_melody(MEL_B, 12, vel=0.82, pan=-0.12)
# A'
comp(PROG, 20, pad_vel=0.9, bass_style='walk', perc=True)
play_melody(MEL_A, 20, vel=1.0, harmony=0.45)
# outro
comp(OUTRO[0], 28, pad_vel=0.85)
play_melody(OUTRO[1], 28, vel=0.75)


# ---------------------------------------------------------------- reverb + mix
def reverb_ir(seconds=2.4, rt60=2.0, predelay=0.022):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal((2, n)) * np.exp(-6.9 * t / rt60)
    k = np.ones(6) / 6
    ir = np.stack([np.convolve(ch, k, 'same') for ch in ir])     # darker tail
    ir = np.concatenate([np.zeros((2, int(predelay * SR))), ir], axis=1)
    return ir / np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True))


IR = reverb_ir()
send = {'box': 0.42, 'pad': 0.30, 'bass': 0.10, 'perc': 0.15}
level = {'box': 1.0, 'pad': 1.0, 'bass': 1.0, 'perc': 1.0}
mix = np.zeros((2, LEN + TAIL))
for name, sig in buses.items():
    mix += sig * level[name]
    wet = np.stack([fftconvolve(sig[c], IR[c])[:LEN + TAIL] for c in range(2)])
    mix += wet * send[name]

# fold everything after the loop point back onto the start → seamless loop
loop = mix[:, :LEN].copy()
loop[:, :TAIL] += mix[:, LEN:LEN + TAIL]

# gentle glue: soft-clip, then normalise to a calm background level
loop = np.tanh(loop * 1.2) / 1.2
# calm background level (-20 dBFS RMS): phones play it at full volume, pages can't turn it down on iOS
loop *= 10 ** (-20.0 / 20) / np.sqrt(np.mean(loop ** 2))
peak = np.max(np.abs(loop))
if peak > 0.89:
    loop *= 0.89 / peak
print(f'length {LEN / SR:.1f}s  peak {20 * np.log10(np.max(np.abs(loop))):.1f} dBFS  rms {20 * np.log10(np.sqrt(np.mean(loop ** 2))):.1f} dBFS')
for name, sig in buses.items():
    print(f'  {name:5s} rms {20 * np.log10(np.sqrt(np.mean(sig ** 2)) + 1e-12):6.1f} dB (pre-mix)')
seam = np.abs(loop[:, 0] - loop[:, -1]).max()
step = np.abs(np.diff(loop, axis=1)).max()
print(f'  loop seam jump {seam:.4f} (largest sample-to-sample step anywhere: {step:.4f})')

os.makedirs(OUT_DIR, exist_ok=True)
wav = os.path.join(OUT_DIR, 'bgm.wav')
pcm = (np.clip(loop.T, -1, 1) * 32767).astype('<i2')
with open(wav, 'wb') as fh:
    import wave
    w = wave.open(fh, 'wb')
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
    w.close()

ff = os.environ.get('FFMPEG') or shutil.which('ffmpeg')
if ff:
    mp3 = os.path.join(OUT_DIR, 'bgm.mp3')
    subprocess.run([ff, '-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '96k', mp3], check=True)
    os.remove(wav)
    print('wrote', mp3, os.path.getsize(mp3), 'bytes')
else:
    print('wrote', wav, '(install ffmpeg or set FFMPEG=/path/to/ffmpeg to get an mp3)')
    sys.exit(0)
