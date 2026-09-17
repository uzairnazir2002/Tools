WITH
  active_users AS (
    SELECT
      id
    FROM
      users
    WHERE
      active = TRUE
  )
SELECT
  id
FROM
  active_users;
