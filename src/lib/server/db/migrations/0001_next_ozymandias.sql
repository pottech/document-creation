CREATE TABLE "api_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hospital_id" uuid,
	"keycloak_client_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_clients_keycloak_client_id_unique" UNIQUE("keycloak_client_id")
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hospital_id" uuid NOT NULL,
	"patient_number" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_kana" varchar(100),
	"birth_date" date NOT NULL,
	"gender" varchar(10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "care_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hospital_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"plan_type" varchar(20) NOT NULL,
	"sequence_number" integer DEFAULT 1 NOT NULL,
	"record_date" date NOT NULL,
	"consultation_date" date NOT NULL,
	"has_diabetes" boolean DEFAULT false NOT NULL,
	"has_hypertension" boolean DEFAULT false NOT NULL,
	"has_hyperlipidemia" boolean DEFAULT false NOT NULL,
	"height" numeric(5, 1),
	"weight_current" numeric(5, 1),
	"weight_target" numeric(5, 1),
	"bmi" numeric(4, 1),
	"waist_current" numeric(5, 1),
	"waist_target" numeric(5, 1),
	"nutrition_status" varchar(20),
	"blood_pressure_systolic" integer,
	"blood_pressure_diastolic" integer,
	"has_exercise_ecg" boolean DEFAULT false,
	"blood_test_date" date,
	"blood_glucose_condition" varchar(20),
	"blood_glucose_post_meal_hours" integer,
	"blood_glucose" integer,
	"hba1c_current" numeric(3, 1),
	"hba1c_target" numeric(3, 1),
	"total_cholesterol" integer,
	"triglycerides" integer,
	"hdl_cholesterol" integer,
	"ldl_cholesterol" integer,
	"dietary_situation" text,
	"exercise_situation" text,
	"smoking_situation" text,
	"other_lifestyle" text,
	"achievement_goal" text,
	"behavior_goal" text,
	"goal_achievement_status" text,
	"next_goal" text,
	"diet_guidance" jsonb,
	"exercise_guidance" jsonb,
	"smoking_guidance" jsonb,
	"other_guidance" jsonb,
	"has_no_prescription" boolean DEFAULT false,
	"has_medication_explanation" boolean DEFAULT false,
	"treatment_issues" text,
	"other_facility_usage" text,
	"patient_signature" varchar(100),
	"primary_doctor_id" uuid,
	"secondary_doctor_id" uuid,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"pdf_path" varchar(500),
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "care_plan_staffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"care_plan_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"guidance_area" varchar(50) NOT NULL,
	"display_order" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "care_plan_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hospital_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"target_disease" varchar(50),
	"template_data" jsonb NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_clients" ADD CONSTRAINT "api_clients_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_clients" ADD CONSTRAINT "api_clients_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_plans" ADD CONSTRAINT "care_plans_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_plans" ADD CONSTRAINT "care_plans_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_plans" ADD CONSTRAINT "care_plans_primary_doctor_id_users_id_fk" FOREIGN KEY ("primary_doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_plans" ADD CONSTRAINT "care_plans_secondary_doctor_id_users_id_fk" FOREIGN KEY ("secondary_doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_plans" ADD CONSTRAINT "care_plans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_plan_staffs" ADD CONSTRAINT "care_plan_staffs_care_plan_id_care_plans_id_fk" FOREIGN KEY ("care_plan_id") REFERENCES "public"."care_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_plan_staffs" ADD CONSTRAINT "care_plan_staffs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_plan_templates" ADD CONSTRAINT "care_plan_templates_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_plan_templates" ADD CONSTRAINT "care_plan_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "patients_hospital_patient_number_idx" ON "patients" USING btree ("hospital_id","patient_number");--> statement-breakpoint
CREATE INDEX "care_plans_hospital_consultation_date_idx" ON "care_plans" USING btree ("hospital_id","consultation_date");--> statement-breakpoint
CREATE INDEX "care_plans_patient_created_at_idx" ON "care_plans" USING btree ("patient_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "care_plan_staffs_plan_area_order_idx" ON "care_plan_staffs" USING btree ("care_plan_id","guidance_area","display_order");