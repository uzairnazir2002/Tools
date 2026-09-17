select id from users where id in (select user_id from orders where total > 100);
