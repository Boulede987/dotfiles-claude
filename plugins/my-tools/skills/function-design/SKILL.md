---
name: function-design
description: >
  Apply function size and control-flow shape rules when writing or refactoring
  functions. Trigger when a function is long, does multiple things, has nested
  if/for/try blocks, or uses while True / for(;;) loops. Also trigger when the user
  mentions "too long", "hard to follow", or asks to refactor a function. Examples use
  Python but rules apply universally.
---

# Function Design and Control Flow

## 1. Small, Focused Functions — Extract Till You Drop

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

## 2. Avoid Deep Nesting

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
