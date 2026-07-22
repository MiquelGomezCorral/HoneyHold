#!/bin/sh
set -eu

config_file='/opt/honeyhold/protected-tags.conf'

while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in
    ''|'#'*) continue ;;
    *'='*) ;;
    *) continue ;;
  esac
  name=${line#*=}
  [ -n "$name" ] || continue
  escaped_name=$(printf '%s' "$name" | sed "s/'/''/g")
  mysql --protocol=socket -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" <<SQL
INSERT INTO tags (profile_id, name)
SELECT NULL, '$escaped_name'
WHERE NOT EXISTS (
  SELECT 1 FROM tags WHERE profile_id IS NULL AND name = '$escaped_name'
);
SQL
done < "$config_file"
