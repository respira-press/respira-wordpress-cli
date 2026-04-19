# Elementor widget typography

Each Elementor widget has a typography section with these settings:

- `typography_typography: custom` to enable per-widget typography
- `typography_font_family: "Inter"` font family name
- `typography_font_size: { unit: px, size: 18 }` size with unit
- `typography_font_weight: "600"` font weight
- `typography_line_height: { unit: em, size: 1.5 }` line height

To set typography from the CLI:

```bash
respira write edit-element mysite.com about headline-123 \\
  --set=typography_typography=custom \\
  --set='typography_font_size={"unit":"px","size":48}' \\
  --set=typography_font_weight=700
```

To use the global kit's H2 typography instead, clear the override:

```bash
respira write edit-element mysite.com about headline-123 --set=typography_typography=""
```
