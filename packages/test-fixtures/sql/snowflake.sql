select id, iff(active, 'yes', 'no') as status from users qualify row_number() over(partition by id order by created_at desc) = 1;
