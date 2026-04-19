# Divi CLI reference

Respira CLI supports Divi 4 (shortcode-based) and Divi 5 (block-based). The CLI auto-detects which version a site is running.

## Reading

```bash
respira read page mysite.com home            # builder-native JSON
respira read page mysite.com home --as=html  # rendered HTML
```

## Modules

Divi organizes content into sections > rows > columns > modules. Each module has its own shortcode in Divi 4 or block in Divi 5.

```bash
respira find-element mysite.com home "et_pb_text" --text="welcome"
respira write edit-element mysite.com home <moduleId> --set=text="hello"
```

## Shortcode syntax

Divi 4 uses nested shortcodes. See `respira docs divi shortcode-syntax` for the full reference.

## Presets

Divi 5 introduces preset-based styling. See `respira docs divi presets`.
