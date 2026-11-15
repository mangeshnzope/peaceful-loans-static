#!/usr/bin/env python3
"""Validate the TG dashboard JSON, embed it in _worker.js, commit and push.

Usage (from anywhere):
  python3 -I publish.py --check            # dry run: validate + show what would change
  python3 -I publish.py --push "message"   # validate, patch _worker.js, commit, push main

Standard library only. Fails safe: if anything looks off it exits non-zero
and changes nothing.
"""
import json, re, subprocess, sys
from decimal import Decimal
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DATA = REPO / "creator-chart/data/creator_chart_dashboard_data.json"
WORKER = REPO / "_worker.js"
REQUIRED = ["meta", "daily", "weekly", "monthly", "posts", "viewer_mix", "insights"]
FORBIDDEN = {"members_reached", "sv"}  # reach stays out; total impressions allowed (impressions_total) since 16 Nov 2026


# --- esbuild-compatible JS literal (verified byte-identical on the 15 Nov bundle) ---
def esc(x):
    return re.sub(r'\\u([0-9a-f]{4})',lambda m:'\\u'+m.group(1).upper(),json.dumps(x,ensure_ascii=True))
def num(o):
    if isinstance(o,float):
        if o==int(o) and abs(o)<1e15: return str(int(o))
        plain=repr(o)
        t=Decimal(plain).as_tuple()
        ds=''.join(map(str,t.digits)); ex=t.exponent
        z=len(ds)-len(ds.rstrip('0')); ds=ds.rstrip('0'); ex+=z
        cand=('-' if t.sign else '')+f"{ds}e{ex}"
        return cand if len(cand)<len(plain) else plain
    return repr(o)
def lit(o,lv=0):
    p='  '*(lv+1); q='  '*lv
    if isinstance(o,dict):
        if not o: return '{}'
        it=[]
        for k,v in o.items():
            kk=esc(k)[1:-1] if re.fullmatch(r'[^\W\d][\w$]*',k) else esc(k)
            it.append(f'{p}{kk}: {lit(v,lv+1)}')
        return '{\n'+',\n'.join(it)+'\n'+q+'}'
    if isinstance(o,list):
        if not o: return '[]'
        return '[\n'+',\n'.join(p+lit(v,lv+1) for v in o)+'\n'+q+']'
    if isinstance(o,bool): return 'true' if o else 'false'
    if o is None: return 'null'
    if isinstance(o,str): return esc(o)
    return num(o)


def walk_keys(o):
    if isinstance(o, dict):
        for k, v in o.items():
            yield k
            yield from walk_keys(v)
    elif isinstance(o, list):
        for v in o:
            yield from walk_keys(v)


def validate(new, old):
    for k in REQUIRED:
        assert k in new, f"missing section: {k}"
    bad = FORBIDDEN & set(walk_keys(new))
    assert not bad, f"forbidden keys present: {bad}"
    assert new["meta"]["data_to"] >= old["meta"]["data_to"], "data_to went backwards"
    assert len(new["posts"]) >= len(old["posts"]), "posts shrank"
    assert len(new["daily"]) >= len(old["daily"]), "daily rows shrank"


def patch_worker(text, data):
    # esbuild emits:  var creator_chart_dashboard_data_default = {\n ... \n};
    m = re.search(r"(var creator_chart_dashboard_data_default = )\{", text)
    assert m, "embedded data literal not found in _worker.js (bundle format changed?)"
    start = m.end() - 1
    end = text.index("\n};\n", start) + 2  # include closing brace
    literal = lit(data)
    return text[:start] + literal + text[end:]


def run(*a):
    return subprocess.run(a, cwd=REPO, check=True, capture_output=True, text=True).stdout.strip()


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in ("--check", "--push"):
        sys.exit(__doc__)
    new = json.loads(DATA.read_text())
    old = json.loads(run("git", "show", "HEAD:creator-chart/data/creator_chart_dashboard_data.json"))
    validate(new, old)
    patched = patch_worker(WORKER.read_text(), new)
    print(f"OK: data_to {old['meta']['data_to']} -> {new['meta']['data_to']}, "
          f"daily {len(old['daily'])}->{len(new['daily'])}, posts {len(old['posts'])}->{len(new['posts'])}")
    if sys.argv[1] == "--check":
        print("dry run: _worker.js would change by", len(patched) - len(WORKER.read_text()), "chars")
        return
    WORKER.write_text(patched)
    msg = sys.argv[2] if len(sys.argv) > 2 else f"Daily TG dashboard refresh (data to {new['meta']['data_to']})"
    run("git", "add", str(DATA.relative_to(REPO)), "_worker.js")
    run("git", "commit", "-m", msg)
    run("git", "push", "origin", "HEAD:main")
    print("pushed")


if __name__ == "__main__":
    main()
