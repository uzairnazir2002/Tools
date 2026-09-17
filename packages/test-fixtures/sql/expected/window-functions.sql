SELECT
  id,
  row_number() OVER (
    PARTITION BY
      team
    ORDER BY
      score DESC
  ) AS rank
FROM
  results;
