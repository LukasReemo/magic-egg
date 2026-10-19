#!/usr/bin/env python3
"""Optional maintainer check: requires local FFmpeg and ffprobe, no network."""
import hashlib
import json
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'assets/sounds/animals/sources.json').read_text())
size = 0
longest = 0
for recording in manifest['recordings']:
    asset = root / recording['asset'].removeprefix('./')
    raw = asset.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == recording['sha256'], asset
    probe = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_entries',
        'stream=codec_name,channels,sample_rate:format=duration', '-of', 'json', str(asset),
    ]))
    stream = probe['streams'][0]
    duration = float(probe['format']['duration'])
    assert stream['codec_name'] == 'mp3' and stream['channels'] == 1, asset
    assert int(stream['sample_rate']) == 44100, asset
    assert 0 < duration <= 3 and abs(duration - recording['duration']) < .00001, asset
    analysis = subprocess.run([
        'ffmpeg', '-hide_banner', '-i', str(asset), '-af',
        'loudnorm=I=-24:TP=-6:LRA=7:print_format=json', '-f', 'null', '-',
    ], capture_output=True, text=True, check=True).stderr
    levels = json.JSONDecoder().raw_decode(analysis[analysis.rfind('{'):])[0]
    loudness, peak = float(levels['input_i']), float(levels['input_tp'])
    assert -30 <= loudness <= -20, (asset, loudness)
    assert peak <= -5.5, (asset, peak)  # Allow small MP3 reconstruction overshoots.
    size += len(raw)
    longest = max(longest, duration)
    print(f"{recording['id']}: {duration:.3f}s, {loudness:.1f} LUFS, {peak:.1f} dBTP")
print(f"Validated {len(manifest['recordings'])} mono MP3s, {size:,} bytes; longest {longest:.6f}s.")
