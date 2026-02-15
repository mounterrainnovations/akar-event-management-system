import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const EVENT_FORM_FIELDS_TABLE =
  process.env.EVENT_FORM_FIELDS_TABLE || "event_form_fields";

export type EventFormFieldValidationRow = {
  field_name: string;
  label: string;
  field_type: string;
  is_required: boolean;
  is_hidden: boolean;
  options: unknown;
  display_order: number;
};

export async function listEventFormFieldsForValidation(eventId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(EVENT_FORM_FIELDS_TABLE)
    .select(
      "field_name,label,field_type,is_required,is_hidden,options,display_order",
    )
    .eq("event_id", eventId)
    .order("display_order");

  if (error) {
    throw new Error(`Unable to fetch event form fields: ${error.message}`);
  }

  return (data || []) as EventFormFieldValidationRow[];
}
