## Absolute Rules to Follow

1. All work is to be done in /backend and then connected to /frontend
2. Always write clean code with production conventions and naming practices.
3. Once a task is complete make updates/create new md file in /docs following convention.
4. Strictly follow DRY
5. All queries have to be centralized at backend/lib/queries in a manner that they can take a variety of inputs and be re-used.

## Table Schemas

### ENUMS

user_role: user, manager, admin, dev

website_section: highlights

event_status: draft, published, cancelled, completed, waitlist

ticket_status: active, inactive, sold_out

discount_type: percentage, flat

payment_status: pending, paid, failed, refunded

payment_mode: upi, net_banking, debit_card, credit_card

bundle_offer_type: same_tier, cross_tier

### Events

create table public.events (
  id uuid not null default gen_random_uuid (),
  name text not null,
  event_date timestamp with time zone null,
  address_line_1 text not null,
  address_line_2 text null,
  city text not null,
  state text not null,
  country text not null,
  about text null,
  terms_and_conditions text null,
  registration_start timestamp with time zone null,
  registration_end timestamp with time zone null,
  status public.event_status not null default 'draft'::event_status,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone null,
  verification_required boolean not null default false,
  base_event_banner text null,
  location_url text null,
  constraint events_pkey primary key (id),
  constraint events_check check (
    (
      (registration_end is null)
      or (registration_start is null)
      or (registration_end > registration_start)
    )
  )
) TABLESPACE pg_default;

create index IF not exists events_date_idx on public.events using btree (event_date) TABLESPACE pg_default;

create index IF not exists events_deleted_at_idx on public.events using btree (deleted_at) TABLESPACE pg_default;

### Event Tickets

create table public.event_tickets (
id uuid not null default gen_random_uuid (),
event_id uuid not null,
description jsonb null,
price numeric(10, 2) not null,
quantity integer null,
sold_count integer not null default 0,
discount_start timestamp with time zone null,
discount_end timestamp with time zone null,
status public.ticket_status not null default 'active'::ticket_status,
created_at timestamp with time zone not null default now(),
updated_at timestamp with time zone not null default now(),
deleted_at timestamp with time zone null,
max_qty_per_person integer not null default 10,
constraint event_tickets_pkey primary key (id),
constraint event_tickets_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
constraint event_tickets_check check (
(
(quantity is null)
or (sold_count <= quantity)
)
),
constraint event_tickets_price_check check ((price >= (0)::numeric)),
constraint event_tickets_quantity_check check (
(
(quantity is null)
or (quantity > 0)
)
),
constraint event_tickets_sold_count_check check ((sold_count >= 0))
) TABLESPACE pg_default;

create index IF not exists event_tickets_event_idx on public.event_tickets using btree (event_id) TABLESPACE pg_default;

### Event Coupons

create table public.event_coupons (
id uuid not null default gen_random_uuid (),
event_id uuid not null,
code text not null,
discount_value numeric(10, 2) not null,
valid_from timestamp with time zone null,
valid_until timestamp with time zone null,
is_active boolean not null default true,
created_at timestamp with time zone not null default now(),
updated_at timestamp with time zone not null default now(),
deleted_at timestamp with time zone null,
constraint event_coupons_pkey primary key (id),
constraint event_coupon_unique unique (event_id, code),
constraint event_coupons_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
constraint event_coupons_discount_value_check check ((discount_value > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists event_coupons_event_idx on public.event_coupons using btree (event_id) TABLESPACE pg_default;

### Event Form Fields

create table public.event_form_fields (
id uuid not null default gen_random_uuid (),
event_id uuid not null,
field_name text not null,
label text not null,
field_type text not null,
is_required boolean not null default false,
options jsonb null,
display_order integer not null default 0,
created_at timestamp with time zone not null default now(),
answer text null,
constraint event_form_fields_pkey primary key (id),
constraint event_form_fields_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists event_form_fields_event_idx on public.event_form_fields using btree (event_id) TABLESPACE pg_default;

### Event Bundle Offers

create table public.event_bundle_offers (
id uuid not null default extensions.uuid_generate_v4 (),
event_id uuid not null,
name text not null,
buy_quantity integer not null,
get_quantity integer not null,
offer_type public.bundle_offer_type not null default 'same_tier'::bundle_offer_type,
applicable_ticket_ids uuid[] null,
created_at timestamp with time zone not null default now(),
updated_at timestamp with time zone not null default now(),
constraint event_bundle_offers_pkey primary key (id),
constraint event_bundle_offers_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger update_event_bundle_offers_updated_at BEFORE
update on event_bundle_offers for EACH row
execute FUNCTION set_updated_at ();

### Event Registrations

create table public.event_registrations (
  id uuid not null default gen_random_uuid (),
  event_id uuid not null,
  user_id uuid not null,
  coupon_id uuid null,
  total_amount numeric(10, 2) not null,
  final_amount numeric(10, 2) not null,
  payment_status public.payment_status not null default 'pending'::payment_status,
  form_response jsonb not null,
  created_at timestamp with time zone not null default now(),
  is_verified boolean null,
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone null,
  name text not null,
  transaction_id text null,
  tickets_bought jsonb null,
  is_waitlisted boolean null,
  constraint event_registrations_pkey primary key (id),
  constraint event_ticket_name unique (event_id, name),
  constraint event_registrations_coupon_id_fkey foreign KEY (coupon_id) references event_coupons (id) on delete set null,
  constraint event_registrations_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
  constraint event_registrations_transaction_id_fkey foreign KEY (transaction_id) references payments (easebuzz_txnid) on update CASCADE on delete set null,
  constraint event_registrations_user_id_fkey foreign KEY (user_id) references users (id) on delete set null,
  constraint event_registrations_total_amount_check check ((total_amount >= (0)::numeric)),
  constraint event_registrations_final_amount_check check ((final_amount >= (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists event_registrations_event_idx on public.event_registrations using btree (event_id) TABLESPACE pg_default;

create index IF not exists event_registrations_user_idx on public.event_registrations using btree (user_id) TABLESPACE pg_default;

Note -
tickets bought works like - tickets
{
"83acc059-39a4-4c16-9055-1bfb03d41967": 4,
"b9672e9f-1b36-4189-8075-acabdda40976": 2
}, meaning a user can have different quantities of different tickets of the same event hence we pass like this.

### Users

create table public.users (
id uuid not null,
email text null,
full_name text null,
avatar_url text null,
created_at timestamp with time zone null default now(),
updated_at timestamp with time zone null default now(),
phone text null,
constraint users_pkey1 primary key (id),
constraint users_email_key unique (email),
constraint users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

### Admin

create table public.admin (
id uuid not null default gen_random_uuid (),
email text not null,
password text not null,
is_email_verified boolean not null default false,
role public.user_role not null default 'user'::user_role,
created_at timestamp with time zone not null default now(),
updated_at timestamp with time zone not null default now(),
deleted_at timestamp with time zone null,
constraint users_pkey primary key (id),
constraint users_email_unique unique (email),
constraint users_email_lowercase check ((email = lower(email)))
) TABLESPACE pg_default;

create index IF not exists admin_deleted_at_idx on public.admin using btree (deleted_at) TABLESPACE pg_default;

create trigger admin_set_updated_at BEFORE
update on admin for EACH row
execute FUNCTION set_updated_at ();

### Media (All Media aka Media Dump)

create table public.media (
id uuid not null default gen_random_uuid (),
user_id uuid not null,
bucket_name text not null default 'mediaBucket'::text,
file_path text not null,
file_name text not null,
mime_type text not null,
file_size integer not null,
created_at timestamp with time zone not null default now(),
deleted_at timestamp with time zone null,
constraint media_pkey primary key (id),
constraint media_unique_file unique (bucket_name, file_path),
constraint media_user_id_fkey foreign KEY (user_id) references admin (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists media_user_id_idx on public.media using btree (user_id) TABLESPACE pg_default;

create index IF not exists media_deleted_at_idx on public.media using btree (deleted_at) TABLESPACE pg_default;

### Website Media (Website Content Control)

create table public.website_media (
id uuid not null default gen_random_uuid (),
media_id uuid not null,
section public.website_section not null,
display_order integer not null default 0,
is_active boolean not null default true,
created_at timestamp with time zone not null default now(),
updated_at timestamp with time zone not null default now(),
deleted_at timestamp with time zone null,
constraint website_media_pkey primary key (id),
constraint website_media_unique unique (media_id, section),
constraint website_media_media_id_fkey foreign KEY (media_id) references media (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists website_media_section_idx on public.website_media using btree (section) TABLESPACE pg_default;

create index IF not exists website_media_active_idx on public.website_media using btree (is_active) TABLESPACE pg_default;

create index IF not exists website_media_deleted_at_idx on public.website_media using btree (deleted_at) TABLESPACE pg_default;

create trigger website_media_set_updated_at BEFORE
update on website_media for EACH row
execute FUNCTION set_updated_at ();

### Payment (Core transactions for use)

create table public.payments (
  id uuid not null,
  registration_id uuid not null,
  user_id uuid not null,
  easebuzz_txnid text null,
  amount numeric(12, 2) not null,
  refund_amount numeric(12, 2) null default 0,
  status public.payment_status not null default 'pending'::payment_status,
  mode public.payment_mode null,
  gateway_response_message text null,
  initiated_at timestamp with time zone null default now(),
  completed_at timestamp with time zone null,
  refunded_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint payments_pkey primary key (id),
  constraint payments_easebuzz_txnid_key unique (easebuzz_txnid),
  constraint payments_id_key unique (id)
) TABLESPACE pg_default;

create index IF not exists easebuzz_txnid_idx on public.payments using btree (easebuzz_txnid) TABLESPACE pg_default;

### Payment Logs (Log dump of every single easebuzz request)

create table public.payment_logs (
id uuid not null default gen_random_uuid (),
payment_id uuid null,
action character varying(50) not null,
easebuzz_url character varying(100) not null,
request_payload jsonb null,
response_payload jsonb null,
http_status integer null,
easebuzz_status character varying(50) null,
error_message text null,
created_at timestamp with time zone null default now(),
constraint payment_logs_pkey primary key (id),
constraint payment_logs_payment_id_fkey foreign KEY (payment_id) references payments (id) on delete CASCADE
) TABLESPACE pg_default;