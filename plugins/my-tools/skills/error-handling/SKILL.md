---
name: error-handling
description: >
  Apply explicit error-handling rules when writing or reviewing code that can fail.
  Trigger when writing try/except blocks, deciding what a function returns on failure,
  or reviewing code that silently swallows exceptions or returns None/null to signal
  failure. Examples use Python but rules apply universally.
---

# Handle Errors Explicitly

Don't silently swallow exceptions or return `None`/`null` to signal failure without
making it obvious. Fail loudly and early; let the caller decide how to recover.

```python
# Bad
def load_config(path):
    try:
        with open(path) as f:
            return json.load(f)
    except:
        return None   # caller has no idea what went wrong

# Good
def load_config(path):
    try:
        with open(path) as f:
            return json.load(f)
    except FileNotFoundError:
        raise ConfigError(f"Config file not found: {path}")
    except json.JSONDecodeError as e:
        raise ConfigError(f"Invalid JSON in config file {path}: {e}")
```
