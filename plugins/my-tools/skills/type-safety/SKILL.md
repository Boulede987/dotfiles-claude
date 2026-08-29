---
name: type-safety
description: >
  Apply type-safety rules when writing or reviewing function signatures and data
  structures. Trigger when defining a public function's parameters/return type,
  reaching for a raw dict/Any/object to pass structured data, or reviewing a signature
  that hides what it actually accepts or returns. Examples use Python but rules apply
  universally — adapt to the language's type system (static or gradual).
---

# Type Safety

## 1. Type Public Boundaries First

Every function another module calls should have its parameters and return value typed.
Internal, single-use helpers can stay loose if typing them adds no clarity — but a
function crossing a module boundary is exactly where an untyped signature costs the
most, because the caller has no way to know what it actually accepts without reading the
body.

```python
# Bad — caller must read the function body to know what "data" and the return value are
def process(data):
    ...
    return result

# Good — the signature is the contract; caller never needs to read the body to use it
def process_order(order: Order) -> OrderResult:
    ...
    return result
```

---

## 2. Prefer a Named Structure Over `dict`/`Any` at a Boundary

A raw `dict[str, Any]` (or untyped object/hash) crossing a function boundary hides its
shape from both the reader and the type checker — every field access is a guess, and a
missing or renamed key fails at runtime instead of at the call site. This is the same
problem as primitive obsession (see the `naming-conventions` skill), one level up: the
value isn't a lone primitive, but the structure itself carries no guarantees.

```python
# Bad — shape of "order" is implicit; a typo in a key surfaces as a runtime KeyError
def calculate_total(order: dict) -> float:
    return order["price"] * order["quantity"]

# Good — the structure is explicit; a typo is a type-checker error, not a runtime one
@dataclass
class Order:
    price: float
    quantity: int

def calculate_total(order: Order) -> float:
    return order.price * order.quantity
```

`dict`/`Any` is still the right call for genuinely dynamic data — a JSON blob whose
shape isn't known until parsed, a passthrough proxy, a generic cache. Reach for a named
structure when the shape is actually known and stable; don't type dynamic data just to
satisfy this rule.

---

## 3. Narrow the Return Type — Don't Let `None` Hide a Third Case

A return type of `Optional[X]` (or `X | None`) should mean exactly one thing: "there is
no `X`." If the function actually has three outcomes — success, empty, and error — don't
collapse the last two into `None`; the caller can't tell which one they got. Pair this
with the `error-handling` skill: a real failure should raise, not return `None`.

```python
# Bad — None means both "no user found" and "database was unreachable"
def find_user(user_id: int) -> Optional[User]:
    try:
        return db.query(User).get(user_id)
    except DatabaseError:
        return None   # caller can't distinguish "not found" from "DB is down"

# Good — the two outcomes are distinguishable: return None only for the real "no
# result" case; raise for the failure case.
def find_user(user_id: int) -> Optional[User]:
    try:
        return db.query(User).get(user_id)   # None here means genuinely not found
    except DatabaseError as e:
        raise UserLookupError(f"Could not query user {user_id}: {e}")
```

---

## 4. Don't Chase Types for Their Own Sake

Type safety serves the same goal as naming: make the contract visible without reading
the implementation. A type that adds ceremony without adding information — wrapping an
already-unambiguous `int` in a single-field class nobody else will ever construct
differently, or annotating a private one-line helper only you call — is YAGNI applied
to types (see the `architecture` skill). Type the boundary; don't type everything behind
it just because you can.
