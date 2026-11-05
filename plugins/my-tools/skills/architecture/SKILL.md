---
name: architecture
description: >
  Apply module boundary, duplication, and SOLID rules when organizing files or reviewing
  structure. Trigger when a file is growing large, two structures (like a menu and a
  dispatch table) must stay in sync, a conditional chain keeps growing new branches per
  type, a subclass overrides a method to raise/reject, or business logic is coupled to a
  storage format or library, or an abstraction has only one implementation (both routed
  to codebase-design). Also trigger on "code review", "code organization", "SOLID", or
  "over-engineered" requests. Examples use Python but rules apply
  universally.
---

# Architecture: Module Boundaries, DRY, SOLID

This skill complements `mattpocock-skills:codebase-design`, which owns module
interfaces, seams, adapters and depth. Call the Skill tool with `codebase-design` when
designing an interface, when business logic is coupled to a storage format or library
(dependency direction), or when an abstraction has a single implementation (whether a
seam is warranted). Use its vocabulary (module, interface, seam, adapter) here too.
Small extracted functions (`function-design`) live inside a module's implementation,
behind its interface.

## 1. Separation of Concerns — Files and Modules (Single Responsibility)

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
| Long orchestrator function | Apply "extract till you drop" (see the `function-design` skill) |

---

## 2. DRY — Don't Repeat Yourself

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

## 3. The Rest of SOLID, Briefly

Single Responsibility is rule 1 above; Dependency Inversion belongs to
`codebase-design`. The remaining three are narrower but worth naming when the shape
shows up.

**Open/Closed** — adding a new case should mean *adding* code, not editing a chain of
conditionals that already works. An `if/elif` chain that grows a new branch every time
a new type appears is the signal; a registry or polymorphic dispatch (see the DRY
registry pattern in rule 2) lets the new case slot in without touching the existing ones.

```python
# Bad — every new shape means editing this function again
def area(shape):
    if shape.kind == "circle":
        return 3.14159 * shape.radius ** 2
    elif shape.kind == "rectangle":
        return shape.width * shape.height
    # a new shape means another elif here, risking the existing branches

# Good — adding Triangle means adding a class, not editing area()
class Circle:
    def area(self): return 3.14159 * self.radius ** 2

class Rectangle:
    def area(self): return self.width * self.height
```

**Liskov Substitution** — any subtype must work everywhere the base type is expected,
without the caller needing to know which one it got. A subclass that raises
`NotImplementedError` on an inherited method, or narrows what a parameter accepts, breaks
callers written against the base type.

```python
# Bad — ReadOnlyList is a List that lies about being one
class ReadOnlyList(list):
    def append(self, item):
        raise NotImplementedError("read-only")  # breaks any code that treats it as a list

# Good — don't inherit from a type whose full contract you can't honor
class ReadOnlyView:
    def __init__(self, items): self._items = list(items)
    def __getitem__(self, i): return self._items[i]
```

**Interface Segregation** — don't force a caller to depend on methods it never calls.
A fat interface (or base class) with unrelated methods means every implementer carries
dead weight, and every caller is coupled to methods it doesn't use. Split by which
callers actually need which methods.

```python
# Bad — a read-only caller still depends on write/delete it never calls
class Repository(Protocol):
    def get(self, id): ...
    def save(self, item): ...
    def delete(self, id): ...

# Good — split by usage; a read-only caller depends only on what it uses
class ReadableRepository(Protocol):
    def get(self, id): ...

class WritableRepository(Protocol):
    def save(self, item): ...
    def delete(self, id): ...
```

