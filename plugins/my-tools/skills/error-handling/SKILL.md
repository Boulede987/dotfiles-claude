---
name: error-handling
description: >
  Apply explicit error-handling and input-validation rules when writing or reviewing
  code that can fail or that receives external input. Trigger when writing try/except
  blocks, deciding what a function returns on failure, reviewing code that silently
  swallows exceptions or returns None/null to signal failure, or handling a request
  body, file upload, CLI argument, or other data crossing into the system from outside.
  Examples use Python but rules apply universally.
---

# Handle Errors and Untrusted Input Explicitly

## 1. Fail Loudly, Never Swallow Silently

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

---

## 2. Validate at the Trust Boundary, Trust Internally

Anything entering the system from outside — a request body, a file upload, a CLI
argument, an environment variable, a row read from a third-party API — is untrusted
until checked. Validate it once, at the point it crosses in. Once past that boundary,
internal functions should trust the data's shape and not re-validate it defensively at
every layer; that duplicates the check (see the `architecture` skill's DRY rule) and
still leaves the actual entry point unguarded if it's the one layer that gets skipped.

```python
# Bad — no validation at the boundary; untrusted input reaches string-built SQL,
#        so a malicious "user_id" is a SQL injection, not just a bad value.
def get_user_orders(request):
    user_id = request.args["user_id"]
    query = f"SELECT * FROM orders WHERE user_id = {user_id}"
    return db.execute(query)

# Good — validated once at the boundary; internal code trusts the parsed type
# and never builds SQL from raw strings.
def get_user_orders(request):
    user_id = parse_positive_int(request.args.get("user_id"))  # raises on bad input
    return db.execute("SELECT * FROM orders WHERE user_id = ?", (user_id,))
```

The boundary is wherever data stops being "whatever the outside world sent" and starts
being "a value this codebase defined." Push validation to that line; don't scatter it
past it, and don't skip it because "the caller probably sends good data."
