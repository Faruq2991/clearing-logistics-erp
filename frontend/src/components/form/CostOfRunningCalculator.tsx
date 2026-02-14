import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import InputField from "./InputField";
import SelectField from "./SelectField";
import { estimateApi } from "../../services/api";

export const CostOfRunningCalculator = () => {
    const [totalEstimate, setTotalEstimate] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const methods = useForm({
        defaultValues: {
            vehicle_cost: "",
            shipping_fees: "",
            customs_duty: "",
            terminal: "other",
        },
    });

    const { handleSubmit } = methods;

    const handleCalculate = async (data: any) => {
        try {
            setError(null);
            const response = await estimateApi.calculateCostOfRunning({
                vehicle_cost: Number(data.vehicle_cost),
                shipping_fees: Number(data.shipping_fees),
                customs_duty: Number(data.customs_duty),
                terminal: data.terminal,
            });
            setTotalEstimate(response.data.total_estimate);
        } catch (err) {
            setError("An error occurred while calculating the estimate.");
        }
    };

    return (
        <FormProvider {...methods}>
            <div className="bg-white shadow rounded-lg p-4">
                <h2 className="text-xl font-bold mb-4">Cost of Running Calculator</h2>
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
                <form onSubmit={handleSubmit(handleCalculate)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                            name="vehicle_cost"
                            label="Vehicle Cost"
                            type="number"
                        />
                        <InputField
                            name="shipping_fees"
                            label="Shipping Fees"
                            type="number"
                        />
                        <InputField
                            name="customs_duty"
                            label="Customs Duty"
                            type="number"
                        />
                        <SelectField
                            name="terminal"
                            label="Terminal"
                            options={[
                                { value: "ptml", label: "PTML" },
                                { value: "other", label: "Other" },
                            ]}
                        />
                    </div>
                    <div className="mt-4">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Calculate
                        </button>
                    </div>
                </form>
                {totalEstimate !== null && (
                    <div className="mt-4 p-4 bg-green-100 rounded-lg">
                        <h3 className="text-lg font-bold">Total Estimate:</h3>
                        <p className="text-2xl">
                            {totalEstimate.toLocaleString("en-NG", {
                                style: "currency",
                                currency: "NGN",
                            })}
                        </p>
                    </div>
                )}
            </div>
        </FormProvider>
    );
};
