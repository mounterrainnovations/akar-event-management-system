## Absolute Rules to Follow

1. All work is to be done in /backend.
2. /frontend is only for reference.
3. Always write clean code with production conventions and naming practices.
4. Once a task is complete make updates/create new md file in /docs following convention.
5. Strictly follow DRY

## Table Schemas

### ENUMS

user_role: user, manager, admin, dev

website_section: highlights

event_status: draft, published, cancelled, completed

ticket_status: active, inactive, sold_out

discount_type: percentage, flat

payment_status: pending, paid, failed, refunded

payment_mode:	upi, net_banking, debit_card, credit_card

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
discount_type public.discount_type not null,
discount_value numeric(10, 2) not null,
usage_limit integer null,
used_count integer not null default 0,
valid_from timestamp with time zone null,
valid_until timestamp with time zone null,
is_active boolean not null default true,
created_at timestamp with time zone not null default now(),
updated_at timestamp with time zone not null default now(),
deleted_at timestamp with time zone null,
constraint event_coupons_pkey primary key (id),
constraint event_coupon_unique unique (event_id, code),
constraint event_coupons_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
constraint event_coupons_discount_value_check check ((discount_value > (0)::numeric)),
constraint event_coupons_usage_limit_check check (
(
(usage_limit is null)
or (usage_limit > 0)
)
),
constraint event_coupons_used_count_check check ((used_count >= 0))
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
constraint event_form_fields_pkey primary key (id),
constraint event_form_fields_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists event_form_fields_event_idx on public.event_form_fields using btree (event_id) TABLESPACE pg_default;

### Event Registrations

create table public.event_registrations (
id uuid not null default gen_random_uuid (),
event_id uuid not null,
ticket_id uuid not null,
user_id uuid not null,
coupon_id uuid null,
quantity integer not null default 1,
total_amount numeric(10, 2) not null,
discount_amount numeric(10, 2) not null default 0,
final_amount numeric(10, 2) not null,
payment_status public.payment_status not null default 'pending'::payment_status,
form_response jsonb not null,
created_at timestamp with time zone not null default now(),
is_verified boolean null,
constraint event_registrations_pkey primary key (id),
constraint event_registrations_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
constraint event_registrations_user_id_fkey foreign KEY (user_id) references users (id) on delete set null,
constraint event_registrations_ticket_id_fkey foreign KEY (ticket_id) references event_tickets (id) on delete RESTRICT,
constraint event_registrations_coupon_id_fkey foreign KEY (coupon_id) references event_coupons (id) on delete set null,
constraint event_registrations_quantity_check check ((quantity > 0)),
constraint event_registrations_total_amount_check check ((total_amount >= (0)::numeric)),
constraint event_registrations_final_amount_check check ((final_amount >= (0)::numeric)),
constraint event_registrations_discount_amount_check check ((discount_amount >= (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists event_registrations_event_idx on public.event_registrations using btree (event_id) TABLESPACE pg_default;

create index IF not exists event_registrations_user_idx on public.event_registrations using btree (user_id) TABLESPACE pg_default;

### Users

create table public.users (
id uuid not null,
email text null,
full_name text null,
avatar_url text null,
created_at timestamp with time zone null default now(),
updated_at timestamp with time zone null default now(),
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
  id uuid not null default gen_random_uuid (),
  registration_id uuid not null,
  user_id uuid not null,
  easebuzz_txnid character varying(40) null,
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
  constraint payments_easebuzz_txnid_key unique (easebuzz_txnid)
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

## Event Flow Help

1. events — The Container

Represents the event itself.

Defines:

What the event is

When and where

Registration window

Status (draft, published, etc.)

Everything else hangs off this.

events
└── id

🔹 2. event_tickets — Purchasable Units

One event → multiple ticket types.

Examples:

Early Bird

VIP

General Admission

Each ticket has:

price

quantity

sold_count

sale window

status

events (1)
└── event_tickets (many)

Relationship:

event_tickets.event_id → events.id

🔹 3. event_coupons — Discount Layer

Coupons belong to an event.

They define:

code

percentage or flat discount

usage limits

validity window

events (1)
└── event_coupons (many)

Relationship:

event_coupons.event_id → events.id

Coupons are applied during registration.

🔹 4. event_form_fields — Dynamic Registration Schema

Defines the form structure per event.

Each row = one form field.

Examples:

Full Name

Phone

T-shirt Size (dropdown)

events (1)
└── event_form_fields (many)

Relationship:

event_form_fields.event_id → events.id

Frontend reads this table to render forms dynamically.

🔹 5. event_registrations — The Purchase Record

Represents one completed (or pending) purchase.

Contains:

event_id

ticket_id

user_id

coupon_id (optional)

quantity

total_amount

discount_amount

final_amount

payment_status

form_response (JSON answers)

events (1)
└── event_registrations (many)

event_tickets (1)
└── event_registrations (many)

event_coupons (1)
└── event_registrations (many, optional)

users (1)
└── event_registrations (many)

🔹 How It Flows In Real Life
Admin Creates:

Event

Ticket types

Coupons

Form fields

User Registers:

Selects ticket

Applies coupon (optional)

Fills dynamic form

Payment processed

Registration inserted

Ticket sold_count incremented

Coupon used_count incremented

All inside a transaction.

🔹 Visual Relationship Map
users
└── event_registrations

events
├── event_tickets
├── event_coupons
├── event_form_fields
└── event_registrations

event_tickets
└── event_registrations

event_coupons
└── event_registrations

🔹 Logical Layering
Layer Responsibility
events Defines event
event_tickets Defines pricing & inventory
event_coupons Defines discount logic
event_form_fields Defines registration schema
event_registrations Stores actual purchases

##
