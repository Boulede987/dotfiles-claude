---
name: generate-docs
description: >
  Generate or refresh PlantUML documentation from source code using the personal
  DocGeneration toolset. Trigger when the user says "generate docs", "update docs",
  "refresh documentation", "run doc gen", or similar. Also trigger when the user
  asks why docs are out of date.
---

# Generate Documentation

Pull the latest scripts, detect the project type, run the correct generator.

## Step 1 — Locate the DocGeneration repo

Check `$env:DOCGEN_REPO` (Windows) or `$DOCGEN_REPO` (Unix). If unset, default to:
- Windows: `C:\Users\<current user>\.tools\DocGeneration`
- Unix/Mac: `~/.tools/DocGeneration`

If the directory does not exist, clone it:
```
git clone https://github.com/Boulede987/DocGeneration.git <resolved_path>
```

## Step 2 — Pull latest scripts

```
git -C <DOCGEN_REPO> pull --quiet
```

## Step 3 — Detect project type

Check the **current working directory** (the project Claude is working in) for these markers, in priority order:

| Priority | Marker | Project type | Script |
|----------|--------|--------------|--------|
| 1 | `Assets/` folder + `ProjectSettings/` folder | Unity C# | `generate_class_diagramm_unity.py` |
| 2 | `*.csproj` or `*.sln` file anywhere in tree | Generic C# | `generate_class_diagramm.py` |
| 3 | `*.sql` file (especially `DBSetUp.sql`) | SQL / Merise | `generate_mcd.py` + `generate_mld.py` |

If multiple types match (e.g. a C# project with a SQL file), ask the user which documentation to generate rather than guessing.

If no marker matches, ask the user which script to use.

## Step 4 — Run the script

### Unity C#
```
python <DOCGEN_REPO>/generate_class_diagramm_unity.py <project_root>/Assets
```
Output lands in `<project_root>/Assets/Modelisation/`.

### Generic C#
```
python <DOCGEN_REPO>/generate_class_diagramm.py <src_root>
```
`src_root` = the directory that contains the `.cs` files (or the project root if `.cs` files are spread across subfolders). Output lands in `<src_root>/Modelisation/`.

### SQL / Merise
```
python <DOCGEN_REPO>/generate_mcd.py <path/to/DBSetUp.sql>
python <DOCGEN_REPO>/generate_mld.py <path/to/DBSetUp.sql>
```
Output lands next to the `.sql` file (`MCD.puml`, `MLD.puml`, `MLD.html`).

## Step 5 — Report

Tell the user:
- Which script ran
- Where output files were written
- How many classes/tables were parsed (the scripts print this to stdout)
- If anything failed, show the error verbatim
