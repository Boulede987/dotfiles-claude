---
name: testing
description: >
  Apply testing discipline when writing new code, fixing a bug, or reviewing test
  coverage. Trigger when the user asks to write tests, fix a bug (write a failing test
  first), mentions TDD, "test coverage", "unit test", mocking, or pastes a test file
  for review. Examples use Python (pytest) but rules apply universally.
---

# Testing Discipline

## 1. Test Behavior, Not Implementation

Tests should verify what a unit *does*, observed through its public interface — not
how it does it internally. A test that reaches into private state or asserts on
internal call order breaks the moment the implementation is refactored, even when the
behavior didn't change. That's the opposite of what a test is for.

```python
# Bad — asserts on a private attribute and an internal method call.
#        Any internal refactor (rename _cache, change algorithm) breaks this test
#        even though the public behavior is unchanged.
def test_get_price():
    calc = PriceCalculator()
    calc.get_price("SKU1")
    assert calc._cache["SKU1"] == 19.99
    assert calc._fetch_count == 1

# Good — asserts on the observable result only.
def test_get_price_returns_catalog_price():
    calc = PriceCalculator()
    assert calc.get_price("SKU1") == 19.99
```

Signal you're testing implementation: the test breaks on a refactor that didn't change
any public behavior. If that happens, the test was coupled to the wrong thing.

---

## 2. Descriptive Names, Arrange-Act-Assert

A test name should state the scenario and the expected outcome — reading the name alone
should tell you what broke, without opening the test body. Structure the body in three
visible parts: set up state, perform the action, assert the outcome.

```python
# Bad — name says nothing about the scenario; setup/action/assert are tangled
def test_discount():
    u = User(active=True, tier="premium")
    assert calculate_discount(u) == 0.20

# Good
def test_calculate_discount_returns_20_percent_for_active_premium_user():
    # Arrange
    user = User(active=True, tier="premium")

    # Act
    discount = calculate_discount(user)

    # Assert
    assert discount == 0.20
```

One behavior per test. If a test name needs "and" to describe it, split it — same rule
as function design (see the `function-design` skill).

---

## 3. TDD Cycle for New Behavior and Bug Fixes

For new behavior: write a failing test that describes the behavior first (red), write
the minimum code to pass it (green), then clean up without changing behavior (refactor).
Don't write the implementation first and backfill tests after — backfilled tests tend
to assert what the code *does*, not what it's *supposed* to do, and silently confirm
bugs already present.

For a bug fix specifically: write a test that reproduces the bug and fails against the
current code, before touching the fix. That test is what proves the bug existed and
stays as a regression guard once the fix lands.

```python
# 1. Red — reproduces the reported bug (discount applied to inactive users)
def test_calculate_discount_returns_zero_for_inactive_user():
    user = User(active=False, tier="premium")
    assert calculate_discount(user) == 0.0   # fails against current buggy code

# 2. Green — smallest fix that makes it pass
def calculate_discount(user):
    if not user.active:
        return 0.0
    ...

# 3. Refactor — clean up implementation; the test keeps passing throughout
```

---

## 4. Mock at the Boundary, Not the Internals

Replace real collaborators with test doubles only at boundaries you don't own or that
are slow/non-deterministic — network calls, the filesystem, a database, wall-clock time.
Don't mock a collaborator you own just to isolate a unit; that turns the test into a
check that your mocks were called correctly, not that the code works.

This is the same boundary the `architecture` skill's dependency-inversion rule
describes: mock the interface the policy depends on (`IPricingTierSource` /
`load_pricing_tiers`), never the policy's own internal helper functions.

```python
# Bad — mocks an internal collaborator the code owns; test proves nothing about
#        real behavior, only that apply_discount() was called with these args.
def test_process_order():
    order = Order(total=100)
    with mock.patch("shop.apply_discount") as mock_discount:
        process_order(order)
        mock_discount.assert_called_once_with(order)

# Good — mocks only the true external boundary (payment gateway network call);
#        everything else runs for real, so the test exercises real behavior.
def test_process_order_charges_discounted_total():
    order = Order(total=100, user=User(active=True, tier="premium"))
    with mock.patch("shop.payment_gateway.charge") as mock_charge:
        process_order(order)
        mock_charge.assert_called_once_with(amount=80)
```

Over-mocked tests are a smell shared with tight coupling: if testing a unit requires
mocking five internal collaborators, the unit's dependencies are probably tangled — see
the `architecture` skill.

---

## 5. Cover Failure Paths, Not Just the Happy Path

A function that can raise, return an error, or reject invalid input needs a test for
that path — not just the case where everything succeeds. This pairs directly with the
`error-handling` skill's rule against silently swallowed failures: if a failure is
supposed to raise a specific exception, a test should assert that it does.

```python
# Bad — only the happy path is covered
def test_load_config():
    config = load_config("valid.json")
    assert config["key"] == "value"

# Good — the documented failure path is covered too
def test_load_config_raises_on_missing_file():
    with pytest.raises(ConfigError, match="not found"):
        load_config("missing.json")
```

---

## 6. Independent Tests

Tests must not depend on execution order or on state left behind by another test. Each
test sets up everything it needs and cleans up after itself (or relies on fixtures that
do). A test suite that only passes in one specific order has hidden shared state — that
state is a bug waiting to surface in production too.

```python
# Bad — test_delete_user depends on test_create_user having run first
def test_create_user():
    db.insert(User(id=1, name="Alice"))

def test_delete_user():
    db.delete(1)   # only works if test_create_user already ran

# Good — each test is self-contained
def test_delete_user_removes_it_from_the_database():
    db.insert(User(id=1, name="Alice"))
    db.delete(1)
    assert db.get(1) is None
```
