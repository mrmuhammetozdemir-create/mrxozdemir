import json, os

_dir = os.path.dirname(os.path.abspath(__file__))
_path = os.path.join(_dir, "seed_data.json")

with open(_path, encoding="utf-8") as _f:
    SEED_DATA = json.load(_f)
