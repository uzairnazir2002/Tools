select toDate(ts) as day, count() from events group by day;
