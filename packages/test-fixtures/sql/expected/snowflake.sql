SELECT
  id,
  iff(active, 'yes', 'no') AS status
FROM
  users
QUALIFY
  row_number() over (
    PARTITION BY
      id
    ORDER BY
      created_at desc
  ) = 1;
