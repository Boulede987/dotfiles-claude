# `architecture` uses `codebase-design` for module interfaces

`architecture` uses `mattpocock-skills:codebase-design`'s vocabulary (module, interface,
seam, adapter, depth) and defers to it where they overlap, such as when a seam or
abstraction is warranted. This doesn't conflict with `function-design`'s small extracted
functions: they live inside a deep module's implementation, behind its interface.
