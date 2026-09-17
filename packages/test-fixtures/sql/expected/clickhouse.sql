SELECT
  toDate(ts) AS day,
  count()
FROM
  EVENTS
GROUP BY
  day;
