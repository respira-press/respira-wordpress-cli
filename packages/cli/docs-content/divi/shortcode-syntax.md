# Divi shortcode syntax

Divi 4 stores page content as nested shortcodes. The structure looks like:

```
[et_pb_section][et_pb_row][et_pb_column][et_pb_text]body[/et_pb_text][/et_pb_column][/et_pb_row][/et_pb_section]
```

Each shortcode accepts attributes inline:

```
[et_pb_text _builder_version="4.20" text_font="Inter|700|||||||" text_font_size="24px"]
```

Respira CLI parses this into structured JSON so you can edit individual attributes without regex. Use `respira write edit-element` with `--set=<attr>=<value>`.
