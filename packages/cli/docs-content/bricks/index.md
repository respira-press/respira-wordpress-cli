# Bricks CLI reference

Respira CLI supports Bricks Builder with full coverage of the element tree, global settings, and templates.

## Reading

```bash
respira read page mysite.com home
respira read design-system mysite.com     # colors, fonts, spacing
```

## Elements

Bricks elements have unique ids stored in the page content. Respira CLI preserves these ids across edits.

```bash
respira find-element mysite.com home --type=heading
respira write edit-element mysite.com home <elementId> --set=text="hello"
```

## Global classes

Bricks supports global classes shared across elements. See `respira docs bricks global-classes`.

## Templates

Templates are Bricks' primary reusability primitive. Use `respira read templates` to list them.
