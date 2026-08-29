---
name: naming-conventions
description: >
  Apply naming, constants, comment, and primitive-obsession conventions when writing or
  reviewing code. Trigger when choosing variable/function names, replacing magic
  numbers, deciding whether a value belongs in a constant, writing/reviewing comments,
  or when a raw int/str/float carries a unit or invariant that a comment has to explain.
  Also trigger when the user mentions "readable", "clean up", or pastes code and asks
  about naming. Examples use Python but rules apply universally.
---

# Naming, Constants, and Comments

## 1. No Magic Numbers, No Abbreviations

Replace raw literals with named constants that convey intent. Names must be fully
spelled out — if a reader has to guess what a name means, it is wrong.

```python
# Bad
if status == 3:
    retry_after(30)
PY = sys.executable
pad = (width - len(title)) // 2

# Good
STATUS_RATE_LIMITED = 3
MAX_RETRY_DELAY_SECONDS = 30
if status == STATUS_RATE_LIMITED:
    retry_after(MAX_RETRY_DELAY_SECONDS)

PYTHON_EXE = sys.executable
left_pad = (width - len(title)) // 2
```

Common offenders: `hr` (header), `PY` (Python executable), `pad` (padding), `cb`
(callback), `cfg` (config), `fn` (function), `ret` (return value), `buf` (buffer),
`ctx` (context).

Exception: abbreviations universally understood in the domain (`url`, `id`, `http`, `sql`).

---

## 2. Constants: Structural Facts vs. Display Strings

Hardcoded paths, ports, keys, and identifiers are **structural facts** — they describe
the shape of the project. If the structure changes, you want one place to update.
Extract them to named constants in a dedicated `config.py` or `paths.py`.

Display strings (section headers, log messages, menu labels) are ephemeral and never
reused. Leave them inline — extracting them to constants adds noise without benefit.

```python
# Bad — path scattered across many functions; hard to find when structure changes
def step_consistency():
    run_script("check_consistency.py", "Run integrity checks")

def step_generate_sql():
    run_script("generate_sql.py", "Generate all INSERT scripts")

# Good — paths.py owns all script locations; actions.py imports them
# paths.py
CHECK_CONSISTENCY = SCRIPTS / "check_consistency.py"
GENERATE_SQL      = SCRIPTS / "generate_sql.py"

# actions.py
def step_consistency():
    run_script(CHECK_CONSISTENCY, "Run integrity checks")   # display string stays inline

def step_generate_sql():
    run_script(GENERATE_SQL, "Generate all INSERT scripts")
```

---

## 3. Comments Explain *Why*, Not *What*

Well-named code explains what it does. Comments should explain why a non-obvious
decision was made, or warn about a gotcha. Delete comments that just restate the code.

```python
# Bad
# multiply price by quantity
total = price * quantity

# Good — comment still needed because the int can't say what it means
# Prices are stored in cents to avoid floating-point rounding errors
total_cents = price_cents * quantity
```

A comment that exists purely to explain what a raw value "actually" represents is
itself a signal — see rule 4 below.

---

## 4. Primitive Obsession — Wrap Primitives That Carry Meaning or Invariants

When a primitive (`int`, `str`, `float`) always travels with a unit, a rule, or
behavior, it is not "just a number" — it is a value that deserves its own type. Passing
the raw primitive around scatters that meaning across every call site, and forces a
comment to carry what the type should.

Signal: a comment exists only to explain what a value "actually" is, or multiple
functions parse/validate/convert the same primitive the same way.

```python
# Still primitive obsession — the comment carries meaning the code should carry
# Prices are stored in cents to avoid floating-point rounding errors
total_cents = price_cents * quantity

# Better — the type carries the meaning; no comment needed
@dataclass(frozen=True)
class Money:
    cents: int

    def __mul__(self, quantity: int) -> "Money":
        return Money(self.cents * quantity)

total = Money(price_cents) * quantity
```

Not every primitive needs wrapping — a loop counter or a one-off local is fine as a
plain `int`. Wrap when the primitive carries a unit, a validity rule, or behavior
(formatting, arithmetic, comparison) that would otherwise be duplicated at each call
site.
