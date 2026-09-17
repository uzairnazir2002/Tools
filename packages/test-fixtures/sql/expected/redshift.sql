SELECT
  id,
  count(*)
FROM
  events
GROUP BY
  id
ORDER BY
  id;
