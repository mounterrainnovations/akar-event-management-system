"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    WarningCircle,
    Image as ImageIcon,
    UploadSimple,
    X,
    CheckCircle,
    Plus,
    Trash,
    Tag,
    ListDashes,
    Ticket
} from "@phosphor-icons/react/dist/ssr";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { createEventAction, uploadEventBannerAction } from "@/app/admin/events-new-actions";
import { DateTimePicker } from "@/components/ui/datetime-picker";

type EventsNewCreateProps = {
    includeDeleted?: boolean;
};

type Step = "general" | "address" | "coupons" | "form-fields" | "pricings" | "offers";

type CouponData = {
    code: string;
    discountValue: number;
};

type FormFieldData = {
    fieldName: string;
    fieldType: "free_text" | "dropdown" | "image";
    label: string;
    isRequired: boolean;
    options: string[]; // For dropdown
    answer?: string; // Stores image link or default dropdown value
};

type TicketData = {
    name: string;
    brief: string;
    price: number;
    quantity: number;
    maxQuantityPerPerson: number;
};

type EventFormData = {
    // Step 1: General
    name: string;
    baseEventBanner: string | null; // URL
    eventDate: string;
    registrationStart: string;
    registrationEnd: string;
    about: string;
    termsAndConditions: string[];

    // Step 2: Address
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;

    // Step 3: Coupons
    coupons: CouponData[];

    // Step 4: Form Fields
    formFields: FormFieldData[];
    // Step 5: Pricings (Tickets)
    tickets: TicketData[];

    // Step 6: Offers (Bundles)
    bundleOffers: BundleOfferData[];
};

type BundleOfferData = {
    name: string;
    buyQuantity: number;
    getQuantity: number;
    offerType: "same_tier" | "cross_tier";
    applicableTicketIds: string[]; // UUIDs of tickets
};

const INITIAL_DATA: EventFormData = {
    name: "",
    baseEventBanner: null,
    eventDate: "",
    registrationStart: "",
    registrationEnd: "",
    about: "",
    termsAndConditions: ["", "", ""], // Minimum 3 required
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    coupons: [],
    formFields: [],
    tickets: [{ name: "", brief: "", price: 0, quantity: 100, maxQuantityPerPerson: 1 }], // Default one ticket
    bundleOffers: [],
};

export function EventsNewCreate({ includeDeleted }: EventsNewCreateProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [currentStep, setCurrentStep] = useState<Step>("general");
    const [formData, setFormData] = useState<EventFormData>(INITIAL_DATA);
    const [showExitConfirmation, setShowExitConfirmation] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof EventFormData | string, string>>>({});

    // Refs for scrolling to errors
    const formTopRef = useRef<HTMLDivElement>(null);

    const backLink = `/admin?section=events${includeDeleted ? "&includeDeleted=1" : ""}`;

    const handleBack = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowExitConfirmation(true);
    };

    const confirmExit = () => {
        router.push(backLink);
    };

    // Validation
    const validateStep1 = () => {
        const newErrors: any = {};
        if (!formData.name.trim()) newErrors.name = "Event name is required";
        if (!formData.baseEventBanner) newErrors.baseEventBanner = "Event banner is required";
        if (!formData.eventDate) newErrors.eventDate = "Event date is required";
        if (!formData.registrationStart) newErrors.registrationStart = "Registration start date is required";
        if (!formData.registrationEnd) newErrors.registrationEnd = "Registration end date is required";
        if (!formData.about.trim()) newErrors.about = "Event details are required";

        if (formData.registrationStart && formData.registrationEnd) {
            if (new Date(formData.registrationEnd) < new Date(formData.registrationStart)) {
                newErrors.registrationEnd = "End date must be after start date";
            }
        }

        const validTerms = formData.termsAndConditions.filter(t => t.trim().length > 0);
        if (validTerms.length < 3) {
            newErrors.termsAndConditions = "At least 3 terms and conditions are required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors: any = {};
        if (!formData.addressLine1.trim()) newErrors.addressLine1 = "Address Line 1 is required";
        // Address Line 2 is optional
        if (!formData.city.trim()) newErrors.city = "City is required";
        if (!formData.state.trim()) newErrors.state = "State is required";
        if (!formData.country.trim()) newErrors.country = "Country is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep3 = () => {
        const newErrors: any = {};
        formData.coupons.forEach((coupon, index) => {
            if (!coupon.code.trim()) newErrors[`coupon_${index}_code`] = "Code is required";
            if (coupon.discountValue <= 0) newErrors[`coupon_${index}_value`] = "Value must be greater than 0";
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep4 = () => {
        const newErrors: any = {};
        formData.formFields.forEach((field, index) => {
            if (!field.fieldName.trim()) newErrors[`field_${index}_name`] = "Field name is required";
            if (!field.label.trim()) newErrors[`field_${index}_label`] = "Label is required";
            if (field.fieldType === "dropdown" && field.options.length === 0) {
                newErrors[`field_${index}_options`] = "At least one option is required";
            }
            // Logic for image link if needed, but currently it's just a text input if type is image
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep5 = () => {
        const newErrors: any = {};
        if (!formData.tickets || formData.tickets.length === 0) {
            newErrors.tickets = "At least one ticket tier is required";
        }
        formData.tickets.forEach((ticket, index) => {
            if (!ticket.name.trim()) newErrors[`ticket_${index}_name`] = "Name is required";
            if (!ticket.brief.trim()) newErrors[`ticket_${index}_brief`] = "Brief is required";
            if (ticket.price < 0) newErrors[`ticket_${index}_price`] = "Price cannot be negative";
            if (ticket.quantity < 1) newErrors[`ticket_${index}_quantity`] = "Quantity must be at least 1";
            if (ticket.maxQuantityPerPerson < 1) newErrors[`ticket_${index}_maxQuantityPerPerson`] = "Maximum quantity must be at least 1";
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleNext = () => {
        if (currentStep === "general") {
            if (validateStep1()) {
                setCurrentStep("address");
                formTopRef.current?.scrollIntoView({ behavior: "smooth" });
            }
        } else if (currentStep === "address") {
            if (validateStep2()) {
                setCurrentStep("coupons");
                formTopRef.current?.scrollIntoView({ behavior: "smooth" });
            }
        } else if (currentStep === "coupons") {
            if (validateStep3()) {
                setCurrentStep("form-fields");
                formTopRef.current?.scrollIntoView({ behavior: "smooth" });
            }
        } else if (currentStep === "form-fields") {
            if (validateStep4()) {
                setCurrentStep("pricings");
                formTopRef.current?.scrollIntoView({ behavior: "smooth" });
            }
        } else if (currentStep === "pricings") {
            if (validateStep5()) {
                setCurrentStep("offers");
                formTopRef.current?.scrollIntoView({ behavior: "smooth" });
            }
        }
    };

    const handlePrevious = () => {
        if (currentStep === "address") setCurrentStep("general");
        else if (currentStep === "coupons") setCurrentStep("address");
        else if (currentStep === "form-fields") setCurrentStep("coupons");
        else if (currentStep === "pricings") setCurrentStep("form-fields");
        else if (currentStep === "offers") setCurrentStep("pricings");
        formTopRef.current?.scrollIntoView({ behavior: "smooth" });
    };


    const validateStep6 = () => {
        const newErrors: any = {};
        formData.bundleOffers.forEach((offer, index) => {
            if (!offer.name.trim()) newErrors[`offer_${index}_name`] = "Name is required";
            if (offer.buyQuantity < 1) newErrors[`offer_${index}_buyQuantity`] = "Buy qty must be at least 1";
            if (offer.getQuantity < 1) newErrors[`offer_${index}_getQuantity`] = "Get qty must be at least 1";
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = async (status: string = "published") => {
        // Validate all steps before submitting
        const isStep1Valid = validateStep1();
        const isStep2Valid = validateStep2();
        const isStep3Valid = validateStep3();
        const isStep4Valid = validateStep4();
        const isStep5Valid = validateStep5();
        const isStep6Valid = validateStep6();

        if (!isStep1Valid || !isStep2Valid || !isStep3Valid || !isStep4Valid || !isStep5Valid || !isStep6Valid) {
            // Find the *first* step with an error and navigate there
            if (!isStep1Valid) setCurrentStep("general");
            else if (!isStep2Valid) setCurrentStep("address");
            else if (!isStep3Valid) setCurrentStep("coupons");
            else if (!isStep4Valid) setCurrentStep("form-fields");
            else if (!isStep5Valid) setCurrentStep("pricings");
            else if (!isStep6Valid) setCurrentStep("offers");

            formTopRef.current?.scrollIntoView({ behavior: "smooth" });
            toast.error("Please fix errors in the form before submitting.");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createEventAction({
                name: formData.name,
                baseEventBanner: formData.baseEventBanner,
                eventDate: new Date(formData.eventDate).toISOString(),
                registrationStart: new Date(formData.registrationStart).toISOString(),
                registrationEnd: new Date(formData.registrationEnd).toISOString(),
                about: formData.about,
                termsAndConditions: formData.termsAndConditions.filter(t => t.trim()).join("\n"),
                addressLine1: formData.addressLine1,
                addressLine2: formData.addressLine2,
                city: formData.city,
                state: formData.state,
                country: formData.country,
                status: status,
                verificationRequired: false, // Default
                coupons: formData.coupons.map(c => ({
                    code: c.code,
                    discountValue: c.discountValue,
                    isActive: true
                })),
                formFields: formData.formFields.map((f, i) => ({
                    fieldName: f.fieldName,
                    label: f.label,
                    fieldType: f.fieldType,
                    isRequired: f.isRequired,
                    options: f.fieldType === "dropdown" ? f.options : null,
                    displayOrder: i,
                    imageLink: f.fieldType === "image" ? f.answer : null,
                    dropdownSelected: f.fieldType === "dropdown" ? f.answer : null // Both map to answer column but keeping logic clear
                })),
                tickets: (formData.tickets || []).map(t => ({
                    description: { name: t.name, brief: t.brief },
                    price: t.price,
                    quantity: t.quantity,
                    maxQuantityPerPerson: t.maxQuantityPerPerson
                })),
                bundleOffers: formData.bundleOffers.map(b => ({
                    name: b.name,
                    buyQuantity: b.buyQuantity,
                    getQuantity: b.getQuantity,
                    offerType: b.offerType,
                    applicableTicketIds: b.applicableTicketIds.length > 0 ? b.applicableTicketIds : null
                }))
            });

            if (result.success) {
                toast.success(`Event ${status === 'draft' ? 'saved as draft' : 'created'} successfully!`);
                // onSuccess?.(); // This line was in the instruction but onSuccess is not defined in this component.
                queryClient.invalidateQueries({ queryKey: ["admin-events"] });
                router.push(`/admin?section=events&eventId=${result.eventId}`);
            } else {
                toast.error(result.error || "Failed to create event");
            }

        } catch (err) {
            console.error(err);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // File Upload
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const data = new FormData();
        data.append("file", file);

        try {
            const result = await uploadEventBannerAction(data);
            if (result.error) {
                toast.error(`Upload failed: ${result.error}`);
            } else if (result.publicUrl) {
                setFormData(prev => ({ ...prev, baseEventBanner: result.publicUrl }));
                setErrors(prev => ({ ...prev, baseEventBanner: undefined }));
                toast.success("Banner uploaded successfully!");
            }
        } catch (err) {
            console.error("Upload failed", err);
            toast.error("Upload failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    // Form handlers
    const updateField = (field: keyof EventFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field as string]) {
            setErrors(prev => ({ ...prev, [field as string]: undefined }));
        }
    };

    const updateNestedField = (index: number, field: string, value: any, listName: "coupons" | "formFields" | "tickets") => {
        setFormData(prev => ({
            ...prev,
            [listName]: prev[listName].map((item, i) => i === index ? { ...item, [field]: value } : item)
        }));
        // Clear error
        const errorKey = listName === "coupons" ? `coupon_${index}_${field}` :
            listName === "tickets" ? `ticket_${index}_${field}` :
                `field_${index}_${field}`;
        if (errors[errorKey]) {
            setErrors(prev => ({ ...prev, [errorKey]: undefined }));
        }
    };

    // Terms handlers
    const addTerm = () => {
        setFormData(prev => ({ ...prev, termsAndConditions: [...prev.termsAndConditions, ""] }));
    };

    const removeTerm = (index: number) => {
        setFormData(prev => ({
            ...prev,
            termsAndConditions: prev.termsAndConditions.filter((_, i) => i !== index)
        }));
    };

    const updateTerm = (index: number, value: string) => {
        const newTerms = [...formData.termsAndConditions];
        newTerms[index] = value;
        setFormData(prev => ({ ...prev, termsAndConditions: newTerms }));
    };

    // Coupon handlers
    const addCoupon = () => {
        setFormData(prev => ({
            ...prev,
            coupons: [...prev.coupons, { code: "", discountValue: 0 }]
        }));
    };

    const removeCoupon = (index: number) => {
        setFormData(prev => ({
            ...prev,
            coupons: prev.coupons.filter((_, i) => i !== index)
        }));
    };

    // Form Field handlers
    const addFormField = () => {
        setFormData(prev => ({
            ...prev,
            formFields: [...prev.formFields, { fieldName: "", label: "", fieldType: "free_text", isRequired: false, options: [], answer: "" }]
        }));
    };

    const removeFormField = (index: number) => {
        setFormData(prev => ({
            ...prev,
            formFields: prev.formFields.filter((_, i) => i !== index)
        }));
    };

    const updateFormFieldOptions = (index: number, optionIndex: number, value: string) => {
        setFormData(prev => {
            const newFormFields = [...prev.formFields];
            const newOptions = [...newFormFields[index].options];
            newOptions[optionIndex] = value;
            newFormFields[index] = { ...newFormFields[index], options: newOptions };
            return { ...prev, formFields: newFormFields };
        });
    };

    const addFormFieldOption = (index: number) => {
        setFormData(prev => {
            const newFormFields = [...prev.formFields];
            newFormFields[index] = { ...newFormFields[index], options: [...newFormFields[index].options, ""] };
            return { ...prev, formFields: newFormFields };
        });
    };

    const removeFormFieldOption = (index: number, optionIndex: number) => {
        setFormData(prev => {
            const newFormFields = [...prev.formFields];
            const newOptions = newFormFields[index].options.filter((_, i) => i !== optionIndex);
            newFormFields[index] = { ...newFormFields[index], options: newOptions };
            return { ...prev, formFields: newFormFields };
        });
    };

    // Ticket Handlers
    const addTicket = () => {
        setFormData(prev => ({
            ...prev,
            tickets: [...prev.tickets, { name: "", brief: "", price: 0, quantity: 100, maxQuantityPerPerson: 1 }]
        }));
    };

    const removeTicket = (index: number) => {
        if (formData.tickets.length <= 1) {
            toast.warning("At least one ticket tier is required.");
            return;
        }
        setFormData(prev => ({
            ...prev,
            tickets: prev.tickets.filter((_, i) => i !== index)
        }));
    };

    // Offer Handlers
    const addOffer = () => {
        setFormData(prev => ({
            ...prev,
            bundleOffers: [...prev.bundleOffers, { name: "", buyQuantity: 2, getQuantity: 1, offerType: "same_tier", applicableTicketIds: [] }]
        }));
    };

    const removeOffer = (index: number) => {
        setFormData(prev => ({
            ...prev,
            bundleOffers: prev.bundleOffers.filter((_, i) => i !== index)
        }));
    };

    const getStepDetails = (step: Step) => {
        switch (step) {
            case "general": return { number: 1, label: "General" };
            case "address": return { number: 2, label: "Address" };
            case "coupons": return { number: 3, label: "Coupons" };
            case "form-fields": return { number: 4, label: "Form Data" };
            case "pricings": return { number: 5, label: "Tiers / Activity" };
            case "offers": return { number: 6, label: "Offers" };
            default: return { number: 1, label: "General" };
        }
    };

    const STEPS: Step[] = ["general", "address", "coupons", "form-fields", "pricings", "offers"];

    return (
        <>
            <div className="flex h-full flex-col bg-background">
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-border/40 bg-card px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={backLink}
                            onClick={handleBack}
                            className="group flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" weight="bold" />
                        </Link>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Create New Event</h2>
                            <p className="text-xs text-muted-foreground">
                                Step {getStepDetails(currentStep).number}: {getStepDetails(currentStep).label}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div ref={formTopRef} className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="mx-auto max-w-2xl space-y-8">

                        {/* Stepper Indicator */}
                        <div className="flex items-center justify-center gap-4 mb-8">
                            {STEPS.map((step, idx) => {
                                const stepNum = idx + 1;
                                const isActive = currentStep === step;
                                const isCompleted = STEPS.indexOf(currentStep) > idx;
                                const colorClass = isActive ? "text-primary border-primary bg-primary/10" :
                                    isCompleted ? "text-white border-emerald-500 bg-emerald-500" :
                                        "text-muted-foreground border-muted-foreground/30 bg-muted/30";

                                return (
                                    <div key={step} className="flex items-center gap-2">
                                        <div className={`flex size-8 items-center justify-center rounded-full border-2 text-sm font-bold ${colorClass}`}>
                                            {isCompleted ? <CheckCircle weight="bold" /> : stepNum}
                                        </div>
                                        {idx < STEPS.length - 1 && <div className="hidden sm:block h-0.5 w-8 bg-border"></div>}
                                    </div>
                                );
                            })}
                        </div>

                        {currentStep === "general" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Banner Upload */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Event Banner <span className="text-red-500">*</span>
                                    </label>
                                    <div className={`relative flex h-48 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${errors.baseEventBanner ? "border-red-500/50 bg-red-500/5" : "border-border/60 bg-muted/5 hover:bg-muted/10"}`}>
                                        {formData.baseEventBanner ? (
                                            <>
                                                <img
                                                    src={formData.baseEventBanner}
                                                    alt="Event Banner"
                                                    className="h-full w-full object-cover rounded-lg opacity-80"
                                                />
                                                <button
                                                    onClick={() => setFormData(p => ({ ...p, baseEventBanner: null }))}
                                                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                                                >
                                                    <X weight="bold" />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                                {isUploading ? (
                                                    <div className="flex flex-col items-center">
                                                        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                                        <p className="mt-2 text-xs text-muted-foreground">Uploading...</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <UploadSimple className="mb-3 size-8 text-muted-foreground" />
                                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold text-primary">Click to upload</span> or drag and drop</p>
                                                        <p className="text-xs text-muted-foreground/60">PNG or JPG (MAX. 5MB)</p>
                                                        <input
                                                            type="file"
                                                            className="absolute inset-0 cursor-pointer opacity-0"
                                                            accept=".png, .jpg, .jpeg"
                                                            onChange={handleFileChange}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {errors.baseEventBanner && <p className="text-xs text-red-500">{errors.baseEventBanner}</p>}
                                </div>

                                {/* Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Event Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Enter event name"
                                        value={formData.name}
                                        onChange={(e) => updateField("name", e.target.value)}
                                    />
                                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                                </div>

                                {/* Dates Grid */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">
                                            Registration Start <span className="text-red-500">*</span>
                                        </label>
                                        <DateTimePicker
                                            date={formData.registrationStart ? new Date(formData.registrationStart) : undefined}
                                            setDate={(date) => updateField("registrationStart", date.toISOString())}
                                        />
                                        {errors.registrationStart && <p className="text-xs text-red-500">{errors.registrationStart}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">
                                            Registration End <span className="text-red-500">*</span>
                                        </label>
                                        <DateTimePicker
                                            date={formData.registrationEnd ? new Date(formData.registrationEnd) : undefined}
                                            setDate={(date) => updateField("registrationEnd", date.toISOString())}
                                        />
                                        {errors.registrationEnd && <p className="text-xs text-red-500">{errors.registrationEnd}</p>}
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">
                                            Event Date <span className="text-red-500">*</span>
                                            {(!formData.registrationStart || !formData.registrationEnd) && (
                                                <span className="text-xs font-normal text-muted-foreground ml-2">(Set registration dates first)</span>
                                            )}
                                        </label>
                                        <DateTimePicker
                                            date={formData.eventDate ? new Date(formData.eventDate) : undefined}
                                            setDate={(date) => updateField("eventDate", date.toISOString())}
                                            disabled={!formData.registrationStart || !formData.registrationEnd}
                                            minDate={formData.registrationEnd ? new Date(formData.registrationEnd) : undefined}
                                        />
                                        {errors.eventDate && <p className="text-xs text-red-500">{errors.eventDate}</p>}
                                    </div>
                                    {/* Empty col for spacing */}
                                </div>

                                {/* About */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Event Details (About) <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Describe the event..."
                                        value={formData.about}
                                        onChange={(e) => updateField("about", e.target.value)}
                                    />
                                    {errors.about && <p className="text-xs text-red-500">{errors.about}</p>}
                                </div>

                                {/* Terms */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-foreground">
                                            Terms and Conditions <span className="text-red-500">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addTerm}
                                            className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1"
                                        >
                                            <Plus weight="bold" /> Add Point
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.termsAndConditions.map((term, index) => (
                                            <div key={index} className="flex gap-2">
                                                <span className="py-2 text-xs font-mono text-muted-foreground">{index + 1}.</span>
                                                <input
                                                    type="text"
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                    placeholder={`Term ${index + 1}`}
                                                    value={term}
                                                    onChange={(e) => updateTerm(index, e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeTerm(index)}
                                                    className="p-2 text-muted-foreground hover:text-red-500"
                                                    title="Remove term"
                                                >
                                                    <Trash size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Minimum 3 terms required.</p>
                                    {errors.termsAndConditions && <p className="text-xs text-red-500">{errors.termsAndConditions}</p>}
                                </div>
                            </div>
                        )}

                        {currentStep === "address" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Address Line 1 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        placeholder="Street address"
                                        value={formData.addressLine1}
                                        onChange={(e) => updateField("addressLine1", e.target.value)}
                                    />
                                    {errors.addressLine1 && <p className="text-xs text-red-500">{errors.addressLine1}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Address Line 2 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        placeholder="Apartment, suite, etc."
                                        value={formData.addressLine2}
                                        onChange={(e) => updateField("addressLine2", e.target.value)}
                                    />
                                    {/* Optional */}
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">
                                            City <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder="City"
                                            value={formData.city}
                                            onChange={(e) => updateField("city", e.target.value)}
                                        />
                                        {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">
                                            State <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder="State"
                                            value={formData.state}
                                            onChange={(e) => updateField("state", e.target.value)}
                                        />
                                        {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Country <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        placeholder="Country"
                                        value={formData.country}
                                        onChange={(e) => updateField("country", e.target.value)}
                                    />
                                    {errors.country && <p className="text-xs text-red-500">{errors.country}</p>}
                                </div>
                            </div>
                        )}

                        {currentStep === "coupons" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-semibold">Coupons</h3>
                                        <p className="text-xs text-muted-foreground">Create discount codes for your event</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addCoupon}
                                        className="rounded-md border border-primary text-primary px-3 py-1.5 text-xs font-medium hover:bg-primary/5 flex items-center gap-1"
                                    >
                                        <Plus weight="bold" /> Add Coupon
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {formData.coupons.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                                            <Tag className="mb-2 size-8 opacity-50" />
                                            <p className="text-sm">No coupons added yet</p>
                                        </div>
                                    ) : (
                                        formData.coupons.map((coupon, index) => (
                                            <div key={index} className="rounded-lg border border-border p-4 space-y-3 relative group bg-card/50">
                                                <button
                                                    onClick={() => removeCoupon(index)}
                                                    className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X weight="bold" />
                                                </button>

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-medium">Coupon Code <span className="text-red-500">*</span></label>
                                                        <input
                                                            type="text"
                                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm uppercase font-mono"
                                                            placeholder="e.g., SUMMER20"
                                                            value={coupon.code}
                                                            onChange={(e) => updateNestedField(index, "code", e.target.value.toUpperCase(), "coupons")}
                                                        />
                                                        {errors[`coupon_${index}_code`] && <p className="text-xs text-red-500">{errors[`coupon_${index}_code`]}</p>}
                                                    </div>
                                                </div>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-medium">Discount Value (Flat Amount) <span className="text-red-500">*</span></label>
                                                        <input
                                                            type="number"
                                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                            placeholder="0"
                                                            value={coupon.discountValue}
                                                            onChange={(e) => updateNestedField(index, "discountValue", parseFloat(e.target.value), "coupons")}
                                                        />
                                                        {errors[`coupon_${index}_value`] && <p className="text-xs text-red-500">{errors[`coupon_${index}_value`]}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {currentStep === "form-fields" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-semibold">Form Data</h3>
                                        <p className="text-xs text-muted-foreground"></p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addFormField}
                                        className="rounded-md border border-primary text-primary px-3 py-1.5 text-xs font-medium hover:bg-primary/5 flex items-center gap-1"
                                    >
                                        <Plus weight="bold" /> Add Field
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {formData.formFields.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                                            <ListDashes className="mb-2 size-8 opacity-50" />
                                            <p className="text-sm">No custom fields added</p>
                                        </div>
                                    ) : (
                                        formData.formFields.map((field, index) => (
                                            <div key={index} className="rounded-lg border border-border p-4 space-y-3 relative group bg-card/50">
                                                <button
                                                    onClick={() => removeFormField(index)}
                                                    className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X weight="bold" />
                                                </button>

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-medium">Label (Display Name) <span className="text-red-500">*</span></label>
                                                        <input
                                                            type="text"
                                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                            placeholder="e.g., T-Shirt Size"
                                                            value={field.label}
                                                            onChange={(e) => {
                                                                const newLabel = e.target.value;
                                                                // Update Label
                                                                updateNestedField(index, "label", newLabel, "formFields");

                                                                // Auto-populate Field Name (sanitized)
                                                                // Only if the user hasn't likely manually edited the field name to something completely different? 
                                                                // For now, let's just one-way bind it loosely or just update it. 
                                                                // The user asked to "auto populate", implying direct action.
                                                                const sanitized = newLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                                                                updateNestedField(index, "fieldName", sanitized, "formFields");
                                                            }}
                                                        />
                                                        {errors[`field_${index}_label`] && <p className="text-xs text-red-500">{errors[`field_${index}_label`]}</p>}
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-medium">Field Name (Backend ID) <span className="text-red-500">*</span></label>
                                                        <input
                                                            type="text"
                                                            className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm font-mono text-muted-foreground cursor-not-allowed"
                                                            placeholder="e.g., t_shirt_size"
                                                            value={field.fieldName}
                                                            readOnly
                                                            disabled
                                                        />
                                                        {errors[`field_${index}_name`] && <p className="text-xs text-red-500">{errors[`field_${index}_name`]}</p>}
                                                    </div>
                                                </div>

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-medium">Field Type <span className="text-red-500">*</span></label>
                                                        <Select
                                                            value={field.fieldType}
                                                            onValueChange={(value) => updateNestedField(index, "fieldType", value, "formFields")}
                                                        >
                                                            <SelectTrigger className="h-9 w-full">
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="free_text">Free Text</SelectItem>
                                                                <SelectItem value="dropdown">Dropdown</SelectItem>
                                                                <SelectItem value="image">Image</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-6">
                                                        <input
                                                            type="checkbox"
                                                            id={`required_${index}`}
                                                            checked={field.isRequired}
                                                            onChange={(e) => updateNestedField(index, "isRequired", e.target.checked, "formFields")}
                                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                        <label htmlFor={`required_${index}`} className="text-sm">Mandatory Field</label>
                                                    </div>
                                                </div>

                                                {/* Conditional Inputs */}
                                                {field.fieldType === "dropdown" && (
                                                    <>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <label className="text-xs font-medium">Options <span className="text-red-500">*</span></label>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => addFormFieldOption(index)}
                                                                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                                                                >
                                                                    <Plus className="h-3 w-3" /> Add Option
                                                                </button>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {field.options.map((option, optIndex) => (
                                                                    <div key={optIndex} className="flex gap-2 items-center">
                                                                        <span className="text-xs text-muted-foreground w-4 text-center">{optIndex + 1}.</span>
                                                                        <input
                                                                            type="text"
                                                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                                            placeholder={`Option ${optIndex + 1}`}
                                                                            value={option}
                                                                            onChange={(e) => updateFormFieldOptions(index, optIndex, e.target.value)}
                                                                        />
                                                                        {field.options.length > 1 && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeFormFieldOption(index, optIndex)}
                                                                                className="text-muted-foreground hover:text-red-500"
                                                                            >
                                                                                <X className="h-4 w-4" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {errors[`field_${index}_options`] && <p className="text-xs text-red-500">{errors[`field_${index}_options`]}</p>}
                                                        </div>
                                                        {field.options.filter(opt => opt.trim() !== "").length > 0 && (
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-medium">Default Value (Optional)</label>
                                                                <Select
                                                                    value={field.answer || ""}
                                                                    onValueChange={(value) => updateNestedField(index, "answer", value, "formFields")}
                                                                >
                                                                    <SelectTrigger className="h-9 w-full">
                                                                        <SelectValue placeholder="Select a default..." />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {field.options.filter(opt => opt.trim() !== "").map((opt, i) => (
                                                                            <SelectItem key={i} value={opt}>{opt}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        )}
                                                    </>
                                                )}

                                                {field.fieldType === "image" && (
                                                    <div className="text-xs text-muted-foreground italic px-1">
                                                        User will upload an image for this field.
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {currentStep === "pricings" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-semibold">Tiers / Activity</h3>
                                        <p className="text-xs text-muted-foreground">Set up tiers or activities and pricing</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addTicket}
                                        className="rounded-md border border-primary text-primary px-3 py-1.5 text-xs font-medium hover:bg-primary/5 flex items-center gap-1"
                                    >
                                        <Plus weight="bold" /> Add Tier / Activity
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {formData.tickets.map((ticket, index) => (
                                        <div key={index} className="rounded-lg border border-border p-4 space-y-3 relative group bg-card/50">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-medium">Tier / Activity {index + 1}</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => removeTicket(index)}
                                                    className="p-1.5 text-muted-foreground hover:text-red-500 opacity-60 hover:opacity-100 transition-opacity"
                                                    title="Remove tier / activity"
                                                >
                                                    <Trash size={16} />
                                                </button>
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium">Tier / Activity Name <span className="text-red-500">*</span></label>
                                                    <input
                                                        type="text"
                                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                        placeholder="e.g., Early Bird, Yoga Session"
                                                        value={ticket.name}
                                                        onChange={(e) => updateNestedField(index, "name", e.target.value, "tickets" as any)}
                                                    />
                                                    {errors[`ticket_${index}_name`] && <p className="text-xs text-red-500">{errors[`ticket_${index}_name`]}</p>}
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium">Brief Description <span className="text-red-500">*</span></label>
                                                    <input
                                                        type="text"
                                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                        placeholder="Includes entry or access to activity..."
                                                        value={ticket.brief}
                                                        onChange={(e) => updateNestedField(index, "brief", e.target.value, "tickets" as any)}
                                                    />
                                                    {errors[`ticket_${index}_brief`] && <p className="text-xs text-red-500">{errors[`ticket_${index}_brief`]}</p>}
                                                </div>
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium">Price (₹) <span className="text-red-500">*</span></label>
                                                    <input
                                                        type="number"
                                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                        placeholder="0.00"
                                                        min="0"
                                                        step="0.01"
                                                        value={ticket.price}
                                                        onChange={(e) => updateNestedField(index, "price", parseFloat(e.target.value), "tickets" as any)}
                                                    />
                                                    {errors[`ticket_${index}_price`] && <p className="text-xs text-red-500">{errors[`ticket_${index}_price`]}</p>}
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium">Quantity Available <span className="text-red-500">*</span></label>
                                                    <input
                                                        type="number"
                                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                        placeholder="100"
                                                        min="1"
                                                        value={ticket.quantity}
                                                        onChange={(e) => updateNestedField(index, "quantity", parseInt(e.target.value), "tickets" as any)}
                                                    />
                                                    {errors[`ticket_${index}_quantity`] && <p className="text-xs text-red-500">{errors[`ticket_${index}_quantity`]}</p>}
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium">Max. Per Person <span className="text-red-500">*</span></label>
                                                    <input
                                                        type="number"
                                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                        placeholder="1"
                                                        min="1"
                                                        value={ticket.maxQuantityPerPerson ?? ""}
                                                        onChange={(e) => updateNestedField(index, "maxQuantityPerPerson", e.target.value === "" ? "" : parseInt(e.target.value), "tickets")}
                                                    />
                                                    {errors[`ticket_${index}_maxQuantityPerPerson`] && <p className="text-xs text-red-500">{errors[`ticket_${index}_maxQuantityPerPerson`]}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        )}

                        {currentStep === "offers" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-semibold">Global Bundle Offers</h3>
                                        <p className="text-xs text-muted-foreground">Configure "Buy X Get Y Free" offers</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addOffer}
                                        className="rounded-md border border-primary text-primary px-3 py-1.5 text-xs font-medium hover:bg-primary/5 flex items-center gap-1"
                                    >
                                        <Plus weight="bold" /> Add Bundle Offer
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {formData.bundleOffers.length === 0 ? (
                                        <div className="text-center py-12 border-2 border-dashed border-border/60 rounded-xl bg-muted/5">
                                            <Tag className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                                            <p className="text-sm text-muted-foreground">No bundle offers added yet.</p>
                                            <button
                                                type="button"
                                                onClick={addOffer}
                                                className="mt-4 text-primary text-sm font-medium hover:underline"
                                            >
                                                Create your first offer
                                            </button>
                                        </div>
                                    ) : (
                                        formData.bundleOffers.map((offer, index) => (
                                            <div key={index} className="rounded-lg border border-border p-5 space-y-4 relative group bg-card/50 shadow-sm transition-all hover:shadow-md hover:border-border/80">
                                                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                            {index + 1}
                                                        </div>
                                                        <h4 className="text-sm font-semibold">Offer Definition</h4>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeOffer(index)}
                                                        className="p-1.5 text-muted-foreground hover:text-red-500 opacity-60 hover:opacity-100 transition-opacity"
                                                        title="Remove offer"
                                                    >
                                                        <Trash size={16} />
                                                    </button>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-medium">Offer Name (Internal) <span className="text-red-500">*</span></label>
                                                        <input
                                                            type="text"
                                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                                                            placeholder="e.g., Buy 2 Get 1 Free on Gold Tiers"
                                                            value={offer.name}
                                                            onChange={(e) => updateNestedField(index, "name", e.target.value, "bundleOffers" as any)}
                                                        />
                                                        {errors[`offer_${index}_name`] && <p className="text-xs text-red-500 mt-1">{errors[`offer_${index}_name`]}</p>}
                                                    </div>

                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-medium">Offer Type</label>
                                                            <Select
                                                                value={offer.offerType}
                                                                onValueChange={(value) => updateNestedField(index, "offerType", value, "bundleOffers" as any)}
                                                            >
                                                                <SelectTrigger className="h-9">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="same_tier">Same Tier Only</SelectItem>
                                                                    <SelectItem value="cross_tier">Across Tiers (Cheapest Free)</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <p className="text-[10px] text-muted-foreground italic">
                                                                {offer.offerType === "same_tier"
                                                                    ? "Offer applies when buying multiple tickets of the SAME tier."
                                                                    : "Offer applies when mixing DIFFERENT tiers (cheapest ticket will be free)."}
                                                            </p>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-medium text-emerald-600">Buy Quantity <span className="text-red-500">*</span></label>
                                                                <input
                                                                    type="number"
                                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm border-emerald-500/20"
                                                                    min="1"
                                                                    value={offer.buyQuantity}
                                                                    onChange={(e) => updateNestedField(index, "buyQuantity", parseInt(e.target.value) || 0, "bundleOffers" as any)}
                                                                />
                                                                {errors[`offer_${index}_buyQuantity`] && <p className="text-xs text-red-500">{errors[`offer_${index}_buyQuantity`]}</p>}
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-medium text-emerald-600">Get Quantity <span className="text-red-500">*</span></label>
                                                                <input
                                                                    type="number"
                                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm border-emerald-500/20"
                                                                    min="1"
                                                                    value={offer.getQuantity}
                                                                    onChange={(e) => updateNestedField(index, "getQuantity", parseInt(e.target.value) || 0, "bundleOffers" as any)}
                                                                />
                                                                {errors[`offer_${index}_getQuantity`] && <p className="text-xs text-red-500">{errors[`offer_${index}_getQuantity`]}</p>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 pt-2">
                                                        <label className="text-xs font-medium flex items-center justify-between">
                                                            <span>Applicable Tiers / Activities</span>
                                                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                                {offer.applicableTicketIds.length === 0 ? "All Tiers" : `${offer.applicableTicketIds.length} Selected`}
                                                            </span>
                                                        </label>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                            {formData.tickets.map((ticket, tIdx) => (
                                                                <button
                                                                    key={tIdx}
                                                                    type="button"
                                                                    disabled={!ticket.name}
                                                                    onClick={() => {
                                                                        const ticketName = ticket.name || `Tier ${tIdx + 1}`;
                                                                        const current = [...offer.applicableTicketIds];
                                                                        const exists = current.includes(ticketName);
                                                                        const next = exists
                                                                            ? current.filter(n => n !== ticketName)
                                                                            : [...current, ticketName];
                                                                        updateNestedField(index, "applicableTicketIds" as any, next, "bundleOffers" as any);
                                                                    }}
                                                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-[11px] transition-all text-left ${offer.applicableTicketIds.includes(ticket.name || `Tier ${tIdx + 1}`)
                                                                        ? "bg-primary/10 border-primary text-primary font-medium"
                                                                        : "bg-background border-border hover:border-primary/40 text-muted-foreground"
                                                                        } ${!ticket.name ? "opacity-50 cursor-not-allowed" : ""}`}
                                                                >
                                                                    <div className={`size-3 rounded-full flex items-center justify-center border ${offer.applicableTicketIds.includes(ticket.name || `Tier ${tIdx + 1}`)
                                                                        ? "border-primary bg-primary"
                                                                        : "border-muted-foreground/30"
                                                                        }`}>
                                                                        {offer.applicableTicketIds.includes(ticket.name || `Tier ${tIdx + 1}`) && (
                                                                            <div className="size-1 rounded-full bg-white" />
                                                                        )}
                                                                    </div>
                                                                    <span className="truncate">{ticket.name || `(Unnamed Tier ${tIdx + 1})`}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            If no tiers are selected, the offer applies to ALL tiers.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between pt-4 border-t border-border/40 mt-8">
                            {currentStep === "general" ? (
                                <div></div> // Empty div for spacing
                            ) : (
                                <button
                                    onClick={handlePrevious}
                                    className="rounded-lg border border-border bg-background px-6 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                >
                                    Back
                                </button>
                            )}

                            <div className="flex items-center gap-3">
                                {currentStep === "offers" && (
                                    <button
                                        onClick={() => handleSubmit("draft")}
                                        disabled={isSubmitting}
                                        className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-6 py-2 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
                                    >
                                        Save as Draft
                                    </button>
                                )}
                                <button
                                    onClick={currentStep === "offers" ? () => handleSubmit("published") : handleNext}
                                    disabled={isSubmitting}
                                    className="rounded-lg bg-emerald-600 px-8 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? "Creating..." : (currentStep === "offers" ? "Create Event" : "Next")}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div >

            {/* Exit Confirmation Modal */}
            {
                showExitConfirmation && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div
                            className="absolute inset-0"
                            onClick={() => setShowExitConfirmation(false)}
                        />
                        <div className="relative w-full max-w-sm overflow-hidden rounded-xl bg-card shadow-2xl ring-1 ring-border/50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-6 text-center">
                                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
                                    <WarningCircle className="size-6" weight="fill" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">Discard Changes?</h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Are you sure you want to go back? Your progress will be lost.
                                </p>
                                <div className="mt-6 flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => setShowExitConfirmation(false)}
                                        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmExit}
                                        className="w-full rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
                                    >
                                        Leave
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
}
