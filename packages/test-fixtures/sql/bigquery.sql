select user_id, count(*) as total from `project.dataset.events` group by user_id;
