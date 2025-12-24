from __future__ import annotations

import shutil
import tempfile
from pathlib import Path

FUNCTIONS_DIR = Path(r"d:/ecclesia/.vercel/output/functions")


def materialize_symlink(path: Path) -> bool:
    if not path.is_symlink():
        return False

    target = path.readlink()
    target_path = (path.parent / target).resolve()

    if not target_path.exists():
        print(f"Skipping {path}: target does not exist ({target_path})")
        return False

    tmp_dir = Path(tempfile.mkdtemp(prefix="vercel-func-"))
    payload = tmp_dir / target_path.name

    if target_path.is_dir():
        shutil.copytree(target_path, payload)
        path.unlink()
        shutil.move(str(payload), str(path))
    else:
        shutil.copy2(target_path, payload)
        path.unlink()
        payload.replace(path)

    shutil.rmtree(tmp_dir, ignore_errors=True)
    print(f"Materialized symlink: {path} -> {target_path}")
    return True


def main() -> None:
    if not FUNCTIONS_DIR.exists():
        raise SystemExit(f"Functions directory not found: {FUNCTIONS_DIR}")

    count = 0
    for item in sorted(FUNCTIONS_DIR.rglob('*')):
        if materialize_symlink(item):
            count += 1

    print(f"Replaced {count} symlinks")


if __name__ == "__main__":
    main()
