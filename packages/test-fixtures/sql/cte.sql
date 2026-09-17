with active_users as (select id from users where active = true) select id from active_users;
