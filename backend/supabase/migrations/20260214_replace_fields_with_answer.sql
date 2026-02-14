ALTER TABLE "public"."event_form_fields" DROP COLUMN "image_link";
ALTER TABLE "public"."event_form_fields" DROP COLUMN "dropdown_selected";
ALTER TABLE "public"."event_form_fields" ADD COLUMN "answer" text;
