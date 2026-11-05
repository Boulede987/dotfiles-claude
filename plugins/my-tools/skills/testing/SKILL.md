---
name: testing
description: >
  Test-writing rules that complement mattpocock-skills:tdd: Arrange-Act-Assert
  structure, failure-path coverage, and independent tests. Trigger when writing a test,
  reviewing a test file, or checking test coverage. Examples use Python (pytest) but
  rules apply universally.
---

# Testing Discipline — Additions to `tdd`

This skill complements `mattpocock-skills:tdd`: the test loop, what makes a good test,
and mocking belong to `tdd` (call the Skill tool with `tdd`), and a bug fix's failing
reproduction to `mattpocock-skills:diagnosing-bugs`. This skill adds three rules.

---

## 1. Arrange-Act-Assert

Structure every test body in three visible parts: set up state, perform the action,
assert the outcome. A reader finds the action at a glance and sees exactly which setup
it depends on. A one-line test with no setup (`assert add(2, 3) == 5`) is exempt:
there's nothing to arrange.

```python
# Bad — setup, action and assertion tangled into one line
def test_calculate_discount_returns_20_percent_for_active_premium_user():
    assert calculate_discount(User(active=True, tier="premium")) == 0.20

# Good
def test_calculate_discount_returns_20_percent_for_active_premium_user():
    # Arrange
    user = User(active=True, tier="premium")

    # Act
    discount = calculate_discount(user)

    # Assert
    assert discount == 0.20
```

---

## 2. Cover Failure Paths, Not Just the Happy Path

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

## 3. Independent Tests

Each test sets up everything it needs and cleans up after itself (or relies on fixtures
that do), so it passes alone and in any order. A suite that only passes in one specific
order has hidden shared state — and that state is a bug waiting to surface in
production too.

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
