# `testing` complements `tdd` instead of being replaced by it

`mattpocock-skills:tdd` covers the red → green loop, what a good test is, mocking at
system boundaries, and test anti-patterns, so `testing` defers to it on all of those
(including refactoring sitting outside the loop, in review). `testing` keeps only three
rules `tdd` doesn't state: Arrange-Act-Assert, failure-path coverage, and independent
tests. Bug reproduction defers to `mattpocock-skills:diagnosing-bugs`.

## Considered Options

- Delete `testing` entirely — rejected after comparing them rule by rule: Arrange-Act-Assert,
  failure-path coverage and test independence would have been lost.
