SELECT
  *
FROM
  read_parquet('file.parquet')
WHERE
  id > 1;
