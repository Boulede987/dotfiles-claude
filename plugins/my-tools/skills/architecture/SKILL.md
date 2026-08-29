---
name: architecture
description: >
  Apply module boundary, duplication, dependency-direction, SOLID, and YAGNI rules when
  organizing files or reviewing structure. Trigger when a file is growing large, two
  structures (like a menu and a dispatch table) must stay in sync, business logic is
  coupled to a specific storage format or library, a conditional chain keeps growing new
  branches per type, a subclass overrides a method to raise/reject, or an abstraction
  has only one implementation. Also trigger on "code review", "code organization",
  "SOLID", or "over-engineered" requests. Examples use Python but rules apply
  universally.
---

# Architecture: Module Boundaries, DRY, SOLID, YAGNI

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

## 3. Dependency Inversion — High-Level Policy Must Not Depend on Low-Level Detail

High-level policy is the *what*: "generate invoices for each customer."
Low-level detail is the *how*: "read a spreadsheet to get the data."
The policy must not depend on the detail — if the storage format changes or breaks,
the policy must survive unchanged.

When business logic imports a file-parsing library, opens a workbook, or references
a column by index, the policy and the storage format are fused. Replacing the
spreadsheet with a database means rewriting the policy — which is wrong.

### The rule

Define what the policy *needs* as a plain data structure. Isolate everything that
produces that structure (the format, the file, the query) behind a boundary. The policy
calls the boundary; it never crosses it.

```python
# Bad — the invoice generation policy depends on xlsx existing.
#        Change the spreadsheet format and the policy breaks with it.
def generate_invoices():
    ws = openpyxl.load_workbook('pricing.xlsx')['Tiers']
    for row in ws.iter_rows(min_row=2, values_only=True):
        customer_id = row[0]
        unit_price  = row[3]   # ← magic column index: policy knows xlsx schema
        quantity    = row[4]
        send_invoice(customer_id, unit_price * quantity)

# Good — policy depends only on a plain list. Storage is behind a boundary.
#         Swap xlsx for a SQL query by changing load_pricing_tiers() alone.

# boundary (the only place that knows about xlsx)
def load_pricing_tiers() -> list[dict]:
    """Returns [{'customer_id': ..., 'unit_price': ..., 'quantity': ...}, ...]"""
    ws = openpyxl.load_workbook('pricing.xlsx')['Tiers']
    ...
    return tiers

# policy (knows nothing about xlsx)
def generate_invoices():
    for tier in load_pricing_tiers():
        send_invoice(tier['customer_id'], tier['unit_price'] * tier['quantity'])
```

In a statically-typed OOP language the same boundary is usually named as an interface,
which makes the abstraction the policy depends on visible in the type system instead of
implicit:

```csharp
// Bad — InvoiceService depends on the concrete XlsxPricingReader.
//        Swap the source and InvoiceService's constructor signature must change too.
class InvoiceService {
    private readonly XlsxPricingReader _reader = new XlsxPricingReader("pricing.xlsx");

    public void GenerateInvoices() {
        foreach (var row in _reader.ReadRows())
            SendInvoice(row.CustomerId, row.UnitPrice * row.Quantity);
    }
}

// Good — InvoiceService depends on the IPricingTierSource interface, not on xlsx.
//         Any class implementing the interface can be passed in; the policy is unchanged.
interface IPricingTierSource {
    IEnumerable<PricingTier> ReadTiers();
}

class XlsxPricingTierSource : IPricingTierSource {   // the only class that knows about xlsx
    public IEnumerable<PricingTier> ReadTiers() { /* ... */ }
}

class InvoiceService {
    private readonly IPricingTierSource _source;
    public InvoiceService(IPricingTierSource source) => _source = source;

    public void GenerateInvoices() {
        foreach (var tier in _source.ReadTiers())
            SendInvoice(tier.CustomerId, tier.UnitPrice * tier.Quantity);
    }
}
```

The interface isn't the point — the dependency direction is. In Python, duck typing
gets the same inversion without declaring an interface at all: `load_pricing_tiers`
already *is* the boundary, because `generate_invoices` never names a concrete type, only
the shape of data it returns. Don't add an `ABC`/`Protocol` in Python just to imitate
the C# shape — only introduce one if multiple concrete implementations genuinely need
to satisfy it.

### The coupling test

Ask: "if the storage format disappears or changes completely, how much policy logic
breaks?" If the answer is anything other than zero, the boundary is missing or leaking.

Schema details (column offsets, sheet names, field names) that leak into policy code
are the most common symptom — they mean the policy secretly depends on the format.

---

## 4. The Rest of SOLID, Briefly

Single Responsibility is rule 1 above; Dependency Inversion is rule 3. The remaining
three are narrower but worth naming when the shape shows up.

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

---

## 5. YAGNI — Don't Build the Abstraction Before There's a Second Case

DRY (rule 2) and Open/Closed (rule 4) both call for abstraction — but only once real
duplication or real variation exists. An interface, plugin system, or config layer built
for a use case that doesn't exist yet is speculative complexity: it adds indirection the
reader must trace through, for flexibility nothing currently uses.

Signal: an abstraction with exactly one implementation, a config flag that is never set
to anything but its default, or a "for future extensibility" comment with no concrete
second case named.

```python
# Bad — one exporter, a factory built for hypothetical future formats no one asked for
class ExporterFactory:
    def create(self, format: str) -> "Exporter":
        if format == "csv":
            return CsvExporter()
        raise ValueError(f"Unknown format: {format}")   # every branch but one is dead

def export_report(data):
    exporter = ExporterFactory().create("csv")
    exporter.export(data)

# Good — write the concrete thing; extract the abstraction when a second format
# actually shows up (that's when Open/Closed rule 4 applies)
def export_report(data):
    write_csv(data)
```

The `architecture` skill's own DIP boundary (rule 3) is not an exception to this: that
boundary exists because the storage format is *already* known to be a coupling risk
(pricing data always comes from some external source), not because it might be swapped
someday.
