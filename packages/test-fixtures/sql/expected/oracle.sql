SELECT
  id,
  nvl(NAME, 'unknown')
FROM
  users
WHERE
  rownum <= 10;
