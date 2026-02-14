## Absolute Rules to Follow
1. All work is to be done in /backend.
2. /frontend is only for reference.
3. Always write clean code with production conventions and naming practices.
4. Once a task is complete make updates/create new md file in /docs following convention.
5. Strictly follow DRY

## Table Schemas

### ENUMS

user_role:	user, manager, admin, dev	

website_section:	highlights	

event_status:	draft, published, cancelled, completed	

ticket_status:	active, inactive, sold_out	

discount_type:	percentage, flat	

payment_status:	pending, paid, failed, refunded

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
  about jsonb null,
  terms_and_conditions jsonb null,
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
  transaction_id character varying(40) null,
  form_response jsonb not null,
  created_at timestamp with time zone not null default now(),
  is_verified boolean null,
  constraint event_registrations_pkey primary key (id),
  constraint event_registrations_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
  constraint event_registrations_user_id_fkey foreign KEY (user_id) references users (id) on delete set null,
  constraint event_registrations_ticket_id_fkey foreign KEY (ticket_id) references event_tickets (id) on delete RESTRICT,
  constraint event_registrations_coupon_id_fkey foreign KEY (coupon_id) references event_coupons (id) on delete set null,
  constraint event_registrations_transaction_id_fkey foreign KEY (transaction_id) references payments (easebuzz_txnid) on delete set null,
  constraint event_registrations_quantity_check check ((quantity > 0)),
  constraint event_registrations_total_amount_check check ((total_amount >= (0)::numeric)),
  constraint event_registrations_final_amount_check check ((final_amount >= (0)::numeric)),
  constraint event_registrations_discount_amount_check check ((discount_amount >= (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists event_registrations_event_idx on public.event_registrations using btree (event_id) TABLESPACE pg_default;

create index IF not exists event_registrations_user_idx on public.event_registrations using btree (user_id) TABLESPACE pg_default;

create index IF not exists event_registrations_transaction_idx on public.event_registrations using btree (transaction_id) TABLESPACE pg_default;

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
  hash text null,
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
Layer	Responsibility
events	Defines event
event_tickets	Defines pricing & inventory
event_coupons	Defines discount logic
event_form_fields	Defines registration schema
event_registrations	Stores actual purchases

## Callback Flow Help
Now we move to the callback flow, there you'll recieve a body that looks like - 
```
{
  deduction_percentage: '2.5',
  net_amount_debit: '10.12',
  cardCategory: 'NA',
  unmappedstatus: 'NA',
  addedon: '2026-02-14 08:15:16',
  cash_back_percentage: '50.0',
  bank_ref_num: '11e5ecdb1e8ae0ef52bf35ae69fa8b8f',
  error_Message: 'Transaction is successful.',
  phone: '9876543210',
  easepayid: 'S260214074JZU3',
  cardnum: 'NA',
  upi_va: 'NA',
  payment_source: 'Easebuzz',
  card_type: 'UPI',
  mode: 'UPI',
  error: 'Transaction is successful.',
  bankcode: 'NA',
  name_on_card: 'NA',
  bank_name: 'NA',
  issuing_bank: 'NA',
  PG_TYPE: 'NA',
  amount: '10.12',
  furl: 'http://localhost:3000/api/payments/easebuzz/callback',
  productinfo: 'Event About',
  auth_code: '',
  email: 'userEmail@mail.com',
  status: 'success',
  hash: 'f9a57d10714799328d66ef5b03bf80e407c3e911b7128e36cc0a06dc4a2b512286d29fdd042de730340ef04cd454e6575430d1bdad30cc3195acfa9045c3ba60',
  firstname: 'Event Name',
  surl: 'http://localhost:3000/api/payments/easebuzz/callback',
  key: 'LDY4WLIA4',
  merchant_logo: 'NA',
  udf10: '',
  txnid: '97463c0b-4991-462a-85b3-c3a738fabcb8',
  udf1: '5b7dd4e0-5f4a-4294-a84c-bd861003ef39',
  udf3: '9413e7b8-3025-4667-9c22-1492b2284c41',
  udf2: 'eventId',
  udf5: '',
  udf4: '97463c0b-4991-462a-85b3-c3a738fabcb8',
  udf7: '',
  udf6: '',
  udf9: '',
  udf8: ''
}
```
, Now I want you implement a few
  things - 
  1. Body should be stored in payment_logs fully whatever is received and should ideally never be missing or empty but in case it is we want to log that in the payment_logs too. 
  2. Minimalistic DTO/body extraction so we get the fields we wanna work with - everything is
  not of use to us, we want key, txnid, amount, productinfo, firstname, email, phone, surl, furl, udf1 to udf10, hash, status (can be 'success', 'failure','dropped', 'pending', 'userCancelled', 'initated', 'bounced'), error, error_message (Note while both error and error_message sound like failure, but in case of success they contain the success message instead)
  3. Now first thing is verifying authenticity of hash, use the hash logic in backend/lib/payments/easebuzz/service.ts to build the hash with the body we received and then compare it against the hash they sent. Handle it
  4. Remove the existing success and failure paths in callback because I don't think we'd route there.
  5. Now udf1 is registrationId, udf2 is eventId, udf3 is userId, udf4 is transactionId, they'll be useful later.
  
  ### Business Logic
   Now we move towards business logic, the status received can be 'success', 'failure','dropped', 'pending', 'userCancelled', 'initated', 'bounced', so define three flows - success flow has 'success', failure flow has 'failure', 'dropped', 'userCancelled', 'bounced' and pending flow(alis retry flow alias recheck flow) has 'pending' and 'initiated'.

   1. In all these cases we want to make respective updates to the `payment` table and `event_registration` table (as required) with respective statuses (logging is already done so no issue). How you'll update is using the udf data you have - udf1 is registrationId, udf2 is eventId, udf3 is userId, udf4 is transactionId.
  (GO through existing flows, doc/ and AI.md to understand schemas)
   
   2. Now in case of pending and initiated, i.e pending flow. Setup a retry logic to hit a transactions API every second for 5 seconds of easebuzz - https://testdashboard.easebuzz.in/transaction/v2.1/retrieve with body - `key`, `txnid` and `hash` all of which we have from above callback and the response will be the exact same as above callback's body that we get.

   Note - There is more logic to it but we'll get there slowly.

   3. webook at easebuzz portal will also be given the /callback endpoint only so we are sorted, we don't need to do anything about that

   4. Finally just ensure all logic is clean, streamlines, DRY and production grade with readability, separation of logic
