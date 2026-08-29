---
name: python-conventions
description: >
  Apply Python-specific conventions when writing or reviewing Python code, specifically
  around __main__ guards and Windows console encoding.
---

# Python-Specific Notes

- `if __name__ == "__main__"` is only needed if the file is both a standalone script
  AND imported by other modules. For a pure entry-point script, calling `main()` directly
  at the bottom is simpler.
- On Windows, the default console encoding is cp1252. Fix Unicode output at the entry
  point:
  ```python
  import sys
  sys.stdout.reconfigure(encoding="utf-8")
  ```
