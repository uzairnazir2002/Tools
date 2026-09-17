SELECT
  id,
  payload ->> 'name' AS name
FROM
  events
WHERE
  id = $1;
