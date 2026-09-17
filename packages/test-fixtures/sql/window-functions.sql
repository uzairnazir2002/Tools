select id, row_number() over(partition by team order by score desc) as rank from results;
