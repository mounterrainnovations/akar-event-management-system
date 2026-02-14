export const BOOKING_PAGE_LIMIT = 20;

export const BOOKING_SELECT_FIELDS =
  "id,event_id,user_id,coupon_id,total_amount,final_amount,payment_status,form_response,created_at,updated_at,deleted_at,name,transaction_id,tickets_bought,is_verified";

export const EVENT_TICKET_SELECT_FIELDS =
  "id,event_id,price,quantity,sold_count,status,deleted_at,max_qty_per_person";

export const EVENT_COUPON_SELECT_FIELDS =
  "id,event_id,discount_value,is_active,valid_from,valid_until,deleted_at";

export const EVENT_EXISTENCE_SELECT_FIELDS =
  "id,name,verification_required,deleted_at";
