# Dynamic Forms: Business & Product Requirement Document (BRD & PRD)

**Version:** 1.0
**Date:** 2026-02-15
**Project:** Akar Event Management System
**Feature:** Dynamic Conditional Forms (Dropdown Trigger Logic)

---

# Part 1: Business Requirement Document (BRD)

## 1. Executive Summary

The Akar Event Management System currently utilizes static registration forms. As events become more complex, organizers require the ability to capture specific information based on attendee responses. This project aims to implement a **Dynamic Form Builder** that allows administrators to create forms with conditional logic (specifically, fields triggered by dropdown selections) without writing code. This will enhance data quality, improve user experience by hiding irrelevant fields, and provide organizers with precise attendee data.

## 2. Business Goals & Objectives

- **Increase Flexibility:** Empower event organizers to create tailored registration experiences for diverse event types (e.g., workshops, conferences, dinners).
- **Improve User Experience (UX):** Reduce form fatigue by showing only relevant questions. A logical flow "conversational" feel increases conversion rates.
- **Data Precision:** Capture structured data necessary for logistics (e.g., "Meal Preference" -> "Allergies"). Avoid generic "Notes" fields where data is unstructured.
- **Scalability:** Support future complex event requirements without requiring developer intervention for every new form field.

## 3. Stakeholders

- **Event Organizers (Admins):** Primary users of the Form Builder. Need an intuitive interface to define questions and logic.
- **Attendees (End Users):** Primary users of the Form Renderer. Need a smooth, bug-free registration experience.
- **Developers:** Responsible for implementation and maintenance.
- **Operations/Logistics Team:** Consumers of the structured data (e.g., catering team needs accurate counts of specific dietary requests).

## 4. Scope

### In-Scope

- **Database:** extending `event_form_fields` table to support `is_hidden` and structured `options` JSONb.
- **Admin Frontend:** Enhancing `EventsNewCreate` to allow marking fields as hidden and defining triggers on dropdown options.
- **User Frontend:** Enhancing the registration modal (`EventsNewDetailModal`) to dynamically render fields based on real-time inputs.
- **Back-End:** Validating conditional required fields (server-side enforcement of logic).

### Out-of-Scope

- **Complex Logic:** AND/OR conditions (e.g., "Show if A=1 AND B=2").
  - _Constraint:_ Logic is strictly "Parent Dropdown Selection -> Reveals Child Field".
- **Multi-Page Forms:** The form will remain a single-page modal for now.
- **Calculated Fields:** No math operations (e.g., "Quantity \* Price").

---

# Part 2: Product Requirement Document (PRD)

## 1. User Personas

1.  **Arjun (Event Administrator):** Not tech-savvy. Wants to set up an event quickly. Needs to ask "Are you bringing a guest?" and _only if yes_, ask "Guest Name".
2.  **Priya (Event Attendee):** Busy professional. Wants to register quickly. Gets annoyed by seeing "Guest Name" field when she already selected "No" for bringing a guest.

## 2. User Stories

### Admin Stories (Form Builder)

- **US.A1:** As an Admin, I want to add a Dropdown field (e.g., "Dietary Requirements") with specific options (Veg, Non-Veg, Vegan, Other).
- **US.A2:** As an Admin, I want to create a "Child Field" (e.g., "Please specify allergy") and set it as "Hidden by Default".
- **US.A3:** As an Admin, I want to link a specific option in a Dropdown (e.g., "Other") to a Child Field, so that selecting that option reveals the child field.
- **US.A4:** As an Admin, I want to see a visual indicator of which fields are "dependent" or "hidden" in the form builder list.

### User Stories (Form Renderer)

- **US.U1:** As an Attendee, I want to see only the relevant fields when I open the registration form.
- **US.U2:** As an Attendee, when I select an option in a dropdown (e.g., "Yes" to "Need Transport"), I want the relevant detail fields (e.g., "Pickup Location") to appear instantly.
- **US.U3:** As an Attendee, if I change my answer (e.g., "Yes" -> "No"), the previously revealed fields should disappear, and their values should be cleared/ignored.

## 3. Functional Requirements

### 3.1. Database Schema

We will leverage the existing POSTGRESQL schema with minimal changes.

**Table:** `public.event_form_fields`

| Column        | Type    | Description                              | Change Type |
| :------------ | :------ | :--------------------------------------- | :---------- |
| `id`          | UUID    | Primary Key                              | Existing    |
| `event_id`    | UUID    | Foreign Key                              | Existing    |
| `field_name`  | Text    | Unique identifier for the field (slug)   | Existing    |
| `field_type`  | Text    | `free_text`, `dropdown`, `image`         | Existing    |
| `is_required` | User    | Mandatory check                          | Existing    |
| `options`     | JSONB   | Stores dropdown options & trigger rules  | **MODIFY**  |
| `is_hidden`   | Boolean | If true, field is hidden until triggered | **NEW**     |

**JSONB Structure for `options` (Dropdowns):**

```json
[
  {
    "value": "Option A",
    "label": "Option A Label",
    "triggers": ["child_field_name_1", "child_field_name_2"]
  },
  {
    "value": "Option B",
    "label": "Option B Label",
    "triggers": []
  }
]
```

### 3.2. Admin Interface (Form Builder)

**Location:** `/admin/events/new` (Step 4: Form Fields)

**UI Components:**

1.  **Field Card:**
    - Add Toggle Switch: `Hidden / Dependent Field`.
    - Visual Badge: If hidden, show "Hidden" badge.
2.  **Dropdown Editor:**
    - When adding an Option, provide a multi-select dropdown labeled **"Triggers these fields..."**.
    - This dropdown must list all _other_ fields currently in the form.
    - _Validation:_ Prevent selecting the current field (self-reference).

### 3.3. User Interface (Registration Modal)

**Location:** Event Details Page -> "Register" Button -> Modal

**Logic Engine:**

1.  **State Management:** Maintain a `values` object of all answers.
2.  **Visibility Calculation:**
    - Initialize `visibleFields` set with all fields where `is_hidden === false`.
    - Iterate through all _Dropdown_ fields.
    - Check current value of the dropdown.
    - Find the corresponding option object in schema.
    - If option has `triggers` array, add those field names to `visibleFields`.
3.  **Rendering:** Map through schema fields. If `field.name` is in `visibleFields`, render it. Else, return `null`.

### 3.4. Backend Validation

**Endpoint:** `POST /api/bookings/initiate`

**Algorithm:**

1.  Fetch Event Schema (`event_form_fields`).
2.  Re-calculate `visibleFields` based on the submitted `form_response`.
3.  Iterate through all fields in Schema:
    - **Skip** validation if field is **NOT** in `visibleFields`.
    - **Validate** if field **IS** in `visibleFields`:
      - Check `is_required`. If true and value is empty -> Error.
      - Check type validity (e.g., is value in options for dropdown?).

## 4. Technical Implementation Plan

### 4.1. Migration Step

Run SQL migration to add the column:

```sql
ALTER TABLE public.event_form_fields
ADD COLUMN is_hidden boolean NOT NULL DEFAULT false;
```

### 4.2. Frontend Types

Update TypeScript interfaces in `types.ts` or `schemas.ts`.

```typescript
export interface FormFieldOption {
  value: string;
  label: string;
  triggers: string[]; // List of field_names to reveal
}

export interface FormField {
  fieldName: string;
  fieldType: "free_text" | "dropdown" | "image";
  label: string;
  isRequired: boolean;
  isHidden: boolean; // New property
  options?: FormFieldOption[]; // Updated structure
  // ... other existing props
}
```

### 4.3. Edge Cases & Handling

1.  **Circular Dependency:** Field A triggers Field B, Field B triggers Field A.
    - _Prevention:_ UI should ideally prevent this, but the "Renderer Logic" handles it safely by doing a single pass (not recursive loop) or a depth-limited pass. Since logic is "Parent -> Child", loops are rare but possible. The simple "Set Construction" method described in 3.3 avoids infinite loops.
2.  **Orphaned Fields:** A field is `isHidden=true` but no dropdown triggers it.
    - _Result:_ Field is never shown. This is acceptable (user error by Admin).
3.  **Data Persistence:** User selects "Yes" (reveals Field A), types "Hello" in Field A. User changes to "No" (hides Field A).
    - _Requirement:_ The "Hello" value should strictly NOT be sent to the backend, OR the backend should wipe it before saving.
    - _Decision:_ Backend should sanitize. If a field is not visible, its value in `answers` JSONB should be removed or ignored.

## 5. UI/UX Specifications (Wireframe Description)

### Builder (Options Modal)

```text
[ Option Label ] [ Option Value ]
---------------------------------
[x] Triggers other fields?
    [ Select Fields (Multi-select) v ]
    - [ ] Allergy Details
    - [ ] Medical Condition
```

### Renderer (Flow)

**Initial State:**
[ Dropdown: Meal Preference v ] (Select...)

**User Selects 'Other':**
[ Dropdown: Meal Preference v ] (Other)
|
+-> [ Text: Please specify details... ] (Appears with slide-down animation)

## 6. Future Scope (v2.0)

- **Multi-logic:** "Show if A=1 OR B=2".
- **Value-based Logic:** Logic on text fields (e.g., "Show if Age > 18").
- **Groups/Sections:** Triggering entire sections of the form.
- **Multi-step Wizard:** Breaking long forms into pages based on logic.

---

**End of Document**
