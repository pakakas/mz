---
name: mz-pretty
description: Pretty-printing MarkZero (ADN) payloads with indentation and alignment for human readability.
---

# MZ Pretty Print

MarkZero payloads can be rendered in a human-readable "pretty" format with indentation and alignment while preserving the exact same token structure when parsed by AI.

## Rules

1. **Grid start** (`ⓖ`) on its own line, no indent
2. **Rows** (`→`) indented with 3 spaces after the first row
3. **Column headers** (`§`) on the first row after `ⓖ`
4. **Row separator** (`¦`) and **relation binder** (`→`) aligned with spaces
5. **Title** (optional) embedded between `ⓖ` and `§` on the grid start line
6. **Protocol start** (`ⓟ`) on its own line
7. **Grid refs** (`※`) and **value refs** (`¤`) unchanged

## Examples

### Map (Key-Value)
**Compact:**
```
ⓖ → file → src/main.0 → span → ※0
```
**Pretty:**
```
ⓖ → file → src/main.0
   → span → ※0
```

### Table (Grid with Headers)
**Compact:**
```
ⓖ § type ¦ pos ¦ text → insert ¦ 124 ¦ let
```
**Pretty:**
```
ⓖ § type   ¦ pos ¦ text
   → insert ¦ 124 ¦ let
```

### ToolCall (PAP)
**Compact:**
```
ⓟⓖ → pattern → "const" → files → ※0 ⓖToolCall§ → cmd → grep → args → ※1
```
**Pretty:**
```
ⓟ
ⓖ → pattern → "const"
   → files   → ※0
ⓖToolCall§ → cmd  → grep
   → args → ※1
```

### ToolRegistry (PAP)
**Pretty:**
```
ⓟ
ⓖ → pattern τstr
   → files τset optional
   → flags τmap optional

ⓖ → directory τstr optional

ⓖRegistry§ cmd  ¦ args ¦ returns
   → grep ¦ ※0   ¦ τgrid
   → ls   ¦ ※1   ¦ τgrid
```

### ToolResult
**Pretty:**
```
ⓟ
ⓖResult§ file ¦ line ¦ text
   → a.ts ¦ 10   ¦ const x = 1
   → b.ts ¦ 42   ¦ const y = 2
```

### Error Result
**Pretty:**
```
ⓟ
ⓖError→ code → 404
```

## Zero-Loss Guarantee

Pretty MZ is **cosmetically different** but **semantically identical** to compact MZ. Both produce the same decoded output. The whitespace (spaces, newlines) between markers is ignored by the MarkZero decoder.

---
*Based on PAP Specification v1 - Pakakas Agent Protocol*
