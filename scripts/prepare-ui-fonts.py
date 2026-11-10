"""Build local WOFF2 from the licensed UI00 sources; no application dependency.

Tool: fonttools[woff]==4.60.2. Run with its separate build environment on PYTHONPATH.
"""
from pathlib import Path
import hashlib
import json
import shutil

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "docs/design/ui00/reference/assets"
TARGET = ROOT / "src/assets/fonts"
REPORT = ROOT / "docs/design/ui01/font-manifest.json"
UNICODES = "U+0000-024F,U+02B0-02FF,U+0300-036F,U+1E00-1EFF,U+2000-206F,U+20A0-20CF,U+2100-214F,U+2C60-2C7F,U+A720-A7FF,U+FEFF,U+FFFD"
POLISH = set(map(ord, "ĄĆĘŁŃÓŚŹŻąćęłńóśźż"))
TARGET.mkdir(parents=True, exist_ok=True)
REPORT.parent.mkdir(parents=True, exist_ok=True)
entries = []
for source_name, target_name in [
    ("inter.ttf", "inter-latin-ext-variable.woff2"),
    ("fraunces.ttf", "fraunces-latin-ext-variable.woff2"),
    ("fraunces-italic.ttf", "fraunces-latin-ext-italic-variable.woff2"),
]:
    source = SOURCE / source_name
    target = TARGET / target_name
    font = TTFont(source, recalcTimestamp=False)
    # Keep weight/optical sizing variable. Decorative axes stay at the approved defaults.
    fixed_axes = {a.axisTag: a.defaultValue for a in font["fvar"].axes if a.axisTag in {"SOFT", "WONK"}}
    options = subset.Options()
    options.name_IDs = ["*"]
    options.name_legacy = True
    options.name_languages = ["*"]
    options.layout_features = ["*"]
    options.notdef_outline = True
    processor = subset.Subsetter(options=options)
    processor.populate(unicodes=subset.parse_unicodes(UNICODES))
    processor.subset(font)
    if fixed_axes:
        font = instantiateVariableFont(font, fixed_axes, inplace=True)
    font.flavor = "woff2"
    font.save(target)
    result = TTFont(target)
    assert POLISH <= set(result.getBestCmap()), target_name
    assert {a.axisTag for a in font["fvar"].axes} == {a.axisTag for a in result["fvar"].axes}
    entries.append({
        "file": target.relative_to(ROOT).as_posix(),
        "source": source.relative_to(ROOT).as_posix(),
        "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
        "bytes": target.stat().st_size,
        "axes": [{"tag": a.axisTag, "min": a.minValue, "max": a.maxValue} for a in result["fvar"].axes],
        "polishGlyphs": True,
        "fixedAxes": fixed_axes,
    })
for name in ["INTER-OFL.txt", "FRAUNCES-OFL.txt"]:
    shutil.copyfile(SOURCE / name, TARGET / name)
report = {"tool": "fonttools 4.60.2 / WOFF2", "unicodeRanges": UNICODES,
          "fallback": "Other scripts use the system fallback; names and data are never translated.",
          "fonts": entries, "totalBytes": sum(e["bytes"] for e in entries)}
REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"fonts": len(entries), "bytes": report["totalBytes"], "polishGlyphs": True}))
