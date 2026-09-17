SELECT
  TOP 10 [id],
  [name]
FROM
  [dbo].[users]
WHERE
  [id] = @id;
