alter table tickets drop constraint tickets_status_check;
alter table tickets add constraint tickets_status_check
  check (status in ('open', 'answered', 'escalated', 'closed'));
