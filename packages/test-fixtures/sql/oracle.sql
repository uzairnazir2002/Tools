select id, nvl(name, 'unknown') from users where rownum <= 10;
