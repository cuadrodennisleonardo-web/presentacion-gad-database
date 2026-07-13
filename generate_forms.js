const fs = require('fs');
const path = require('path');

const formsDir = path.join(__dirname, 'src', 'components', 'forms');

const forms = [
  {
    name: 'EmploymentForm',
    type: 'EmploymentFormData',
    schema: 'employmentSchema',
    entity: 'EmploymentRecord',
    createFn: 'createEmploymentRecord',
    updateFn: 'updateEmploymentRecord',
    fields: `
        <SelectField
          label="Employment Status"
          {...register("employment_status")}
          options={[
            { label: "Employed", value: "employed" },
            { label: "Unemployed", value: "unemployed" },
            { label: "Self-employed", value: "self-employed" },
          ]}
          error={errors.employment_status?.message}
        />
        <InputField
          label="Employer"
          {...register("employer")}
          error={errors.employer?.message}
        />
        <InputField
          label="Occupation"
          {...register("occupation")}
          error={errors.occupation?.message}
        />
        <InputField
          label="Monthly Income"
          type="number"
          step="0.01"
          {...register("monthly_income")}
          error={errors.monthly_income?.message}
        />
        <SelectField
          label="Employment Type"
          {...register("employment_type")}
          options={[
            { label: "Regular", value: "regular" },
            { label: "Contractual", value: "contractual" },
            { label: "Seasonal", value: "seasonal" },
          ]}
          error={errors.employment_type?.message}
        />`
  },
  {
    name: 'FarmerForm',
    type: 'FarmerFormData',
    schema: 'farmerSchema',
    entity: 'Farmer',
    createFn: 'createFarmer',
    updateFn: 'updateFarmer',
    fields: `
        <InputField
          label="RSBSA No."
          {...register("rsbsa_no")}
          error={errors.rsbsa_no?.message}
        />
        <SelectField
          label="Farm Type"
          {...register("farm_type")}
          options={[
            { label: "Rice", value: "rice" },
            { label: "Corn", value: "corn" },
            { label: "Vegetable", value: "vegetable" },
            { label: "Livestock", value: "livestock" },
            { label: "Mixed", value: "mixed" },
          ]}
          error={errors.farm_type?.message}
        />
        <InputField
          label="Farm Area (Hectares)"
          type="number"
          step="0.01"
          {...register("farm_area_hectares")}
          error={errors.farm_area_hectares?.message}
        />
        <InputField
          label="Land Ownership"
          {...register("land_ownership")}
          error={errors.land_ownership?.message}
        />`
  },
  {
    name: 'FisherfolkForm',
    type: 'FisherfolkFormData',
    schema: 'fisherfolkSchema',
    entity: 'Fisherfolk',
    createFn: 'createFisherfolk',
    updateFn: 'updateFisherfolk',
    fields: `
        <InputField
          label="FISH-R No."
          {...register("fishr_no")}
          error={errors.fishr_no?.message}
        />
        <SelectField
          label="Fishing Type"
          {...register("fishing_type")}
          options={[
            { label: "Municipal", value: "municipal" },
            { label: "Commercial", value: "commercial" },
            { label: "Aquaculture", value: "aquaculture" },
          ]}
          error={errors.fishing_type?.message}
        />
        <div className="flex items-center mt-6">
          <input
            type="checkbox"
            id="boat_owner"
            {...register("boat_owner")}
            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          <label htmlFor="boat_owner" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Boat Owner
          </label>
        </div>
        <InputField
          label="Gear Type"
          {...register("gear_type")}
          error={errors.gear_type?.message}
        />`
  },
  {
    name: 'BusinessOwnerForm',
    type: 'BusinessOwnerFormData',
    schema: 'businessOwnerSchema',
    entity: 'BusinessOwner',
    createFn: 'createBusinessOwner',
    updateFn: 'updateBusinessOwner',
    fields: `
        <InputField
          label="Business Name"
          {...register("business_name")}
          error={errors.business_name?.message}
        />
        <InputField
          label="Business Type"
          {...register("business_type")}
          error={errors.business_type?.message}
        />
        <InputField
          label="Registration No."
          {...register("registration_no")}
          error={errors.registration_no?.message}
        />
        <InputField
          label="Permit No."
          {...register("permit_no")}
          error={errors.permit_no?.message}
        />
        <InputField
          label="Capitalization"
          type="number"
          step="0.01"
          {...register("capitalization")}
          error={errors.capitalization?.message}
        />
        <InputField
          label="Number of Employees"
          type="number"
          {...register("number_of_employees")}
          error={errors.number_of_employees?.message}
        />
        <SelectField
          label="Status"
          {...register("status")}
          options={[
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
            { label: "Closed", value: "closed" },
          ]}
          error={errors.status?.message}
        />`
  },
  {
    name: 'InformalWorkerForm',
    type: 'InformalWorkerFormData',
    schema: 'informalWorkerSchema',
    entity: 'InformalWorker',
    createFn: 'createInformalWorker',
    updateFn: 'updateInformalWorker',
    fields: `
        <SelectField
          label="Sector Type"
          {...register("sector_type")}
          options={[
            { label: "Vendor", value: "vendor" },
            { label: "Domestic", value: "domestic" },
            { label: "Transport", value: "transport" },
            { label: "Construction", value: "construction" },
            { label: "Other", value: "other" },
          ]}
          error={errors.sector_type?.message}
        />
        <InputField
          label="Location/Route"
          {...register("location")}
          error={errors.location?.message}
        />
        <InputField
          label="Estimated Daily Income"
          type="number"
          step="0.01"
          {...register("estimated_daily_income")}
          error={errors.estimated_daily_income?.message}
        />`
  }
];

const template = (form) => `import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { ${form.schema}, type ${form.type} } from "@/lib/validators";
import { ${form.createFn}, ${form.updateFn} } from "@/services/economicDevService";
import type { ${form.entity} } from "@/types";

import InputField from "./InputField";
import SelectField from "./SelectField";
import ResidentLinkSearch from "./ResidentLinkSearch";

interface ${form.name}Props {
  mode: "create" | "edit";
  record?: ${form.entity} | null;
  onSuccess: () => void;
  onCancel: () => void;
  preselectedResidentId?: string;
}

const ${form.name}: React.FC<${form.name}Props> = ({
  mode,
  record,
  onSuccess,
  onCancel,
  preselectedResidentId,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<${form.type}>({
    resolver: zodResolver(${form.schema}),
    defaultValues: record
      ? {
          ...record,
          // null to empty string conversion handled by inputs naturally
        }
      : {
          resident_id: preselectedResidentId || "",
        },
  });

  const residentId = watch("resident_id");

  const onSubmit = async (data: ${form.type}) => {
    setIsSubmitting(true);
    let error = null;

    if (mode === "create") {
      const res = await ${form.createFn}(data);
      error = res.error;
    } else if (mode === "edit" && record) {
      const res = await ${form.updateFn}(record.id, data);
      error = res.error;
    }

    setIsSubmitting(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success(
        mode === "create" ? "Record created successfully" : "Record updated successfully"
      );
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Resident Selection */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Resident Linked Record <span className="text-error-500">*</span>
        </label>
        {mode === "create" && !preselectedResidentId ? (
          <ResidentLinkSearch
            selectedResidentId={residentId}
            onSelect={(id) => setValue("resident_id", id, { shouldValidate: true })}
          />
        ) : (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {record?.resident
                ? \`\${record.resident.first_name} \${record.resident.last_name}\`
                : "Resident pre-selected"}
            </p>
          </div>
        )}
        {errors.resident_id && (
          <p className="mt-1 text-sm text-error-500">{errors.resident_id.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
${form.fields}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : mode === "create" ? "Add Record" : "Save Changes"}
        </button>
      </div>
    </form>
  );
};

export default ${form.name};
`;

forms.forEach(form => {
  const filePath = path.join(formsDir, form.name + ".tsx");
  fs.writeFileSync(filePath, template(form));
  console.log("Generated " + filePath);
});
