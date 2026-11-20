-- The quiz routes were renamed /find-your-57 -> /signup-01 and /find-your-57-lead ->
-- /signup-02. Relabel rows already stored so source_form / ab_variant identify each route
-- consistently.
update public.signup_submissions set source_form = 'signup-01' where source_form = 'find-your-57';
update public.signup_submissions set source_form = 'signup-02' where source_form = 'find-your-57-lead';
update public.signup_submissions set ab_variant = 'signup-01' where ab_variant = 'find-your-57';
update public.signup_submissions set ab_variant = 'signup-02' where ab_variant = 'find-your-57-lead';
update public.partial_submissions set source_form = 'signup-01' where source_form = 'find-your-57';
update public.partial_submissions set source_form = 'signup-02' where source_form = 'find-your-57-lead';
update public.partial_submissions set ab_variant = 'signup-01' where ab_variant = 'find-your-57';
update public.partial_submissions set ab_variant = 'signup-02' where ab_variant = 'find-your-57-lead';
create index if not exists signup_submissions_source_form_idx on public.signup_submissions (source_form);
create index if not exists partial_submissions_source_form_idx on public.partial_submissions (source_form);
