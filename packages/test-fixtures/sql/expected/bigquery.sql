SELECT
  user_id,
  count(*) AS total
FROM
  `project.dataset.events`
GROUP BY
  user_id;
