---
name: coding
description: >
  Apply the user's coding standards when writing, reviewing, or refactoring code in any
  language. Trigger when writing new code, refactoring existing code, reviewing code for
  quality, or when the user mentions structure, naming, organization, "clean up",
  "readable", "maintainable", "too long", "hard to follow", or "code review". Also trigger
  when the user pastes code and asks for improvements, even without explicitly naming
  clean code. Examples use Python but rules apply universally — adapt naming conventions
  and idioms to the language at hand.
---

# Coding Standards

Apply these principles to every piece of code you write or review. Adapt naming
conventions, formatting, and idioms to the language at hand (e.g. snake_case in Python,
PascalCase for C# classes, camelCase in JavaScript).

---

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

## 2. Small, Focused Functions — Extract Till You Drop

A function should do one thing. If you find yourself describing what it does using the
word "and," it should be split. Keep extracting until every function does exactly one
thing. Aim for ~20–30 lines as a soft guide — comfortably one screen, no hard cutoff.

Nested function definitions are a strong signal: the inner function wants to be a
module-level function with a descriptive name.

```python
# Bad — export() does: texture export, graph clear, constraint creation, item loading,
#        entity loading, recipe parsing, loot parsing...
def export(driver):
    with driver.session() as s:
        WEBUI_TEXTURES.mkdir(...)
        def load_tex_file(filename, label): ...  # ← nested fn = extraction signal
        load_tex_file('entity_textures.txt', 'entity')
        s.run("MATCH (n) DETACH DELETE n")
        item_ids = read_ids('items.txt')
        def parse_stat_file(fname, fields): ...  # ← another nested fn
        ...  # 300 more lines

# Good — export() is an orchestrator; each concern is its own function/module
def export(driver):
    with driver.session() as session:
        texture_map = export_textures()
        clear_graph(session)
        create_constraints(session)
        item_ids = read_ids('items.txt')
        export_items(session, item_ids, texture_map)
        entity_ids = read_ids('mobs.txt')
        export_entities(session, entity_ids, texture_map)
        export_recipes(session, item_ids)
```

At the limit, an orchestrator function reads like a table of contents: it names what
happens and in what order, delegates everything else.

---

## 3. Separation of Concerns — Files and Modules

Each module, class, or file should have one clearly defined responsibility. If code
inside a single file can be grouped into distinct responsibilities, extract each group
into its own module. A divider comment like `# ── section ──────` is a signal that a
file boundary is missing — the comment is patching over a structural problem.

Ask: "if this requirement changes, how many files do I touch?" The answer should be as
small as possible. Common separations worth enforcing: data access vs. business logic
vs. presentation; configuration vs. logic; I/O vs. pure computation.

### Large files are a smell

A file exceeding ~300 lines is a signal it is doing too much. Not a hard rule — some
files are legitimately data-heavy — but treat it as a prompt to ask what distinct
responsibilities live there and whether any should move. The threshold applies per
file, not per class or function.

| Cause | Fix |
|---|---|
| Many unrelated functions | Group by concern, extract to separate modules |
| Large class with many methods | Extract helpers, or split into collaborating classes |
| Data arrays mixed with logic | Separate data file from logic file |
| Nested functions | Extract to module level with descriptive names |
| Long orchestrator function | Apply "extract till you drop" (see rule 2) |

---

## 4. DRY — Don't Repeat Yourself

If you find yourself writing the same logic twice, extract it. Duplication makes bugs
multiply: fixing one copy while missing another is a classic failure mode.

### Registry pattern — single source of truth

When two structures (e.g. a menu and a dispatch table) must stay in sync, derive both
from one registry. Never maintain two parallel lists that can drift apart.

```python
# Bad — menu string and ACTIONS dict must be kept in sync manually
MENU = """
  1  Full pipeline
  2  All jar extractors
"""
ACTIONS = {
    "1": step_full_pipeline,
    "2": step_jar_extract,
}

# Good — one list drives both menu rendering and dispatch
STEPS = [
    (None, "Full",               None),               # section header
    ( "1", "Full pipeline",      step_full_pipeline),
    ( "2", "All jar extractors", step_jar_extract),
]

def build_menu(steps): ...    # iterates STEPS
def dispatch(steps, key): ... # iterates STEPS
```

---

## 5. Avoid Deep Nesting

Deeply nested code is hard to follow. Prefer early returns and guard clauses.

```python
# Bad
def get_user_discount(user):
    if user is not None:
        if user.is_active:
            if user.membership == "premium":
                return 0.20
            else:
                return 0.05
        else:
            return 0.0
    else:
        return 0.0

# Good
def get_user_discount(user):
    if user is None or not user.is_active:
        return 0.0
    if user.membership == "premium":
        return 0.20
    return 0.05
```

### Extract nested control structures

An `if` inside a `for` inside a `try` inside another `if` is extraction waiting to happen. Each nesting level is a sign the inner logic belongs in its own function. Apply "extract till you drop": pull the body of any nested block into a named function until no block is nested inside another.

```python
# Bad — three levels of nesting, logic buried, nothing reusable
def process_orders(orders):
    try:
        for order in orders:
            if order.is_valid():
                if order.total > 0:
                    apply_discount(order)
                    save(order)
    except DatabaseError as e:
        log(e)

# Good — each level extracted; inner functions are testable and reusable
def process_orders(orders):
    try:
        for order in orders:
            process_single_order(order)
    except DatabaseError as e:
        log(e)

def process_single_order(order):
    if not order.is_valid() or order.total <= 0:
        return
    apply_discount(order)
    save(order)
```

Rule of thumb: if you need to scroll horizontally to read a line, or if a block is indented more than two levels, extract.

### Loop exit conditions must be visible

Hidden exit conditions (`while True`, `for(;;)`) force readers to scan the whole loop
body to understand when it stops. Put the exit condition in the loop clause instead.

```python
# Bad
while True:
    choice = input("Choice: ").strip()
    if choice == "0":
        break
    dispatch(choice)

# Good
QUIT = "0"
choice = ""
while choice != QUIT:
    choice = input("Choice: ").strip()
    if choice != QUIT:
        dispatch(choice)
```

---

## 6. Constants: Structural Facts vs. Display Strings

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

## 7. Comments Explain *Why*, Not *What*

Well-named code explains what it does. Comments should explain why a non-obvious
decision was made, or warn about a gotcha. Delete comments that just restate the code.

```python
# Bad
# multiply price by quantity
total = price * quantity

# Good
# Prices are stored in cents to avoid floating-point rounding errors
total_cents = price_cents * quantity
```

---

## 8. Handle Errors Explicitly

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

## 9. Language-Specific Notes

### Python
- `if __name__ == "__main__"` is only needed if the file is both a standalone script
  AND imported by other modules. For a pure entry-point script, calling `main()` directly
  at the bottom is simpler.
- On Windows, the default console encoding is cp1252. Fix Unicode output at the entry
  point:
  ```python
  import sys
  sys.stdout.reconfigure(encoding="utf-8")
  ```

---

## How to Apply This Skill

When **writing new code**: apply all principles from the start. Don't plan to clean up
later — clean up never comes.

When **reviewing or refactoring existing code**: identify the worst violations first
(usually: long functions, magic numbers, deep nesting, oversized files). Refactor
incrementally — a series of small safe changes beats one large risky rewrite.

When **explaining your choices**: briefly call out non-obvious decisions at the end of
your response. Focus on tradeoffs — not every rule applies in every situation, and the
user benefits from understanding *why* you made a particular call, especially when you
deviated from the default. Example: *"I extracted `validate_order` even though it's
only called once, because the validation logic was making `process_order` hard to read
at a glance."* Don't over-explain obvious choices — that creates noise.
