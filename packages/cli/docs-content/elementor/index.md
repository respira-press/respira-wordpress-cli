# Elementor CLI reference

Respira CLI ships with native support for Elementor sites. This page covers the most common topics.

## Elements and widgets

Elementor stores each page as a tree of sections, columns, and widgets. Respira CLI reads this tree as JSON and lets you target any element by id, CSS class, or widget type.

```bash
respira read page mysite.com about
respira find-element mysite.com about "heading" --text="welcome"
respira write edit-element mysite.com about <elementId> --set=title="hello"
```

## Typography

Typography on Elementor lives in two places: the global kit and inline on each element. See `respira docs elementor widget-typography` for the full reference.

## Dynamic tags

Dynamic tags bind element settings to post fields, custom fields, ACF, and more. See `respira docs elementor dynamic-tags`.

## Templates

Templates are reusable blocks. Use `respira read templates` and `respira write create-template` to manage them.
