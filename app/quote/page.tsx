"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quoteSchema, QuoteData } from "@/lib/quote-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, FileText, Download, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function QuotePage() {
    const [isGenerating, setIsGenerating] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<QuoteData>({
        resolver: zodResolver(quoteSchema),
        defaultValues: {
            clientName: "",
            clientContact: "",
            observations: "",
            items: [
                {
                    quantity: 1,
                    product: "",
                    color: "",
                    size: "",
                    doublePrint: false,
                    unitPrice: 0,
                },
            ],
            shippingCost: 0,
        },
    });

    // Autopopulate from latest quote
    React.useEffect(() => {
        const fetchLatest = async () => {
            try {
                const response = await fetch("/api/quote/latest");
                if (response.ok) {
                    const data = await response.json();
                    reset(data);
                    toast.success("Datos pre-cargados automáticamente");
                }
            } catch (error) {
                console.error("Failed to fetch latest quote:", error);
            }
        };
        fetchLatest();
    }, [reset]);

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    const items = watch("items");
    const shippingCost = watch("shippingCost") || 0;

    const subtotal = items.reduce(
        (acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0),
        0
    );
    const total = subtotal + Number(shippingCost);

    const onSubmit = async (data: QuoteData) => {
        setIsGenerating(true);
        try {
            const response = await fetch("/api/quote/pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Error al generar presupuesto");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;

            // Get filename from header or fallback
            const contentDisposition = response.headers.get("Content-Disposition");
            let filename = `Presupuesto-${data.clientName}-${new Date().toISOString().split("T")[0]}.pdf`;
            if (contentDisposition && contentDisposition.includes("filename=")) {
                filename = contentDisposition.split("filename=")[1].replace(/"/g, "");
            }

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("Presupuesto generado correctamente");
        } catch (error) {
            console.error(error);
            toast.error("Hubo un error al generar el PDF");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="container mx-auto py-10 px-4 max-w-5xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Generador de Presupuestos
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Crea presupuestos profesionales para tus clientes de NovaMente.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                        Empresa: NovaMente
                    </Badge>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Left Column: Client Data */}
                    <div className="md:col-span-1 space-y-6">
                        <Card className="border-none shadow-xl bg-secondary/30 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <div className="w-2 h-6 bg-blue-500 rounded-full" />
                                    Datos del Cliente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="clientName">Nombre / Empresa *</Label>
                                    <Input
                                        id="clientName"
                                        placeholder="Ej: Juan Pérez"
                                        className="bg-background/50 border-blue-500/20 focus:border-blue-500"
                                        {...register("clientName")}
                                    />
                                    {errors.clientName && (
                                        <span className="text-xs text-red-500">
                                            {errors.clientName.message}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="clientContact">WhatsApp / Email</Label>
                                    <Input
                                        id="clientContact"
                                        placeholder="Ej: +54 9 11..."
                                        className="bg-background/50"
                                        {...register("clientContact")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="observations">Observaciones</Label>
                                    <Textarea
                                        id="observations"
                                        placeholder="Detalles adicionales..."
                                        className="min-h-[100px] bg-background/50"
                                        {...register("observations")}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl bg-primary text-primary-foreground overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                            <CardContent className="p-6 relative">
                                <h3 className="text-sm font-bold uppercase tracking-wider opacity-80 mb-6">
                                    Resumen de Totales
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="opacity-90">Subtotal</span>
                                        <span className="text-xl font-bold">
                                            ${subtotal.toLocaleString("es-AR")}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="opacity-70">Costo Envío</span>
                                        <div className="flex items-center gap-2 w-24">
                                            <span className="opacity-70">$</span>
                                            <Input
                                                type="number"
                                                className="h-8 bg-white/10 border-white/20 text-right text-primary-foreground focus-visible:ring-white/30"
                                                {...register("shippingCost", { valueAsNumber: true })}
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-white/20 flex justify-between items-center">
                                        <span className="text-lg font-bold">TOTAL</span>
                                        <span className="text-3xl font-black">
                                            ${total.toLocaleString("es-AR")}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isGenerating}
                                    className="w-full mt-8 bg-white text-primary hover:bg-white/90 font-bold py-6 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-95"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Generando...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="mr-2 h-5 w-5" />
                                            Descargar PDF
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Items */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <FileText className="text-purple-500" />
                                Items del Presupuesto
                            </h2>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    append({
                                        quantity: 1,
                                        product: "",
                                        color: "",
                                        size: "",
                                        doublePrint: false,
                                        unitPrice: 0,
                                    })
                                }
                                className="border-purple-500/20 hover:bg-purple-50 text-purple-600"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Agregar Item
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <Card key={field.id} className="relative overflow-hidden group border-none shadow-md hover:shadow-lg transition-shadow duration-300 bg-background/50 border border-border/50">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-400" />
                                    <CardContent className="p-4 pt-6">
                                        <div className="grid grid-cols-12 gap-4">
                                            <div className="col-span-2 space-y-2">
                                                <Label className="text-[10px] uppercase text-muted-foreground font-bold">Cant.</Label>
                                                <Input
                                                    type="number"
                                                    className="h-9 px-2"
                                                    {...register(`items.${index}.quantity` as const, {
                                                        valueAsNumber: true,
                                                    })}
                                                />
                                            </div>
                                            <div className="col-span-4 space-y-2">
                                                <Label className="text-[10px] uppercase text-muted-foreground font-bold">Prenda / Producto</Label>
                                                <Input
                                                    placeholder="Ej: Remera Oversize"
                                                    className="h-9"
                                                    {...register(`items.${index}.product` as const)}
                                                />
                                            </div>
                                            <div className="col-span-2 space-y-2">
                                                <Label className="text-[10px] uppercase text-muted-foreground font-bold">Color</Label>
                                                <Input
                                                    placeholder="Blanco"
                                                    className="h-9 px-2"
                                                    {...register(`items.${index}.color` as const)}
                                                />
                                            </div>
                                            <div className="col-span-2 space-y-2">
                                                <Label className="text-[10px] uppercase text-muted-foreground font-bold">Talle</Label>
                                                <Input
                                                    placeholder="XL"
                                                    className="h-9 px-2"
                                                    {...register(`items.${index}.size` as const)}
                                                />
                                            </div>
                                            <div className="col-span-2 flex items-center pt-6 justify-end">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => remove(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="col-span-4 space-y-2">
                                                <Label className="text-[10px] uppercase text-muted-foreground font-bold">Precio Unitario ARS</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1.5 text-muted-foreground">$</span>
                                                    <Input
                                                        type="number"
                                                        className="h-9 pl-7"
                                                        {...register(`items.${index}.unitPrice` as const, {
                                                            valueAsNumber: true,
                                                        })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="col-span-4 flex items-center space-x-2 pt-6">
                                                <Switch
                                                    id={`items.${index}.doublePrint`}
                                                    checked={watch(`items.${index}.doublePrint`)}
                                                    onCheckedChange={(checked) => setValue(`items.${index}.doublePrint`, checked)}
                                                />
                                                <Label htmlFor={`items.${index}.doublePrint`} className="text-sm cursor-pointer whitespace-nowrap">
                                                    Doble estampado
                                                </Label>
                                            </div>

                                            <div className="col-span-4 text-right pt-6">
                                                <div className="text-[10px] uppercase text-muted-foreground font-bold">Subtotal</div>
                                                <div className="text-lg font-bold text-blue-600">
                                                    ${((watch(`items.${index}.quantity`) || 0) * (watch(`items.${index}.unitPrice`) || 0)).toLocaleString("es-AR")}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {fields.length === 0 && (
                                <div className="text-center py-20 bg-secondary/20 rounded-2xl border-2 border-dashed border-border/50">
                                    <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                                    <p className="text-muted-foreground">No has agregado items a este presupuesto.</p>
                                    <Button
                                        type="button"
                                        variant="link"
                                        onClick={() => append({ quantity: 1, product: "", color: "", size: "", doublePrint: false, unitPrice: 0 })}
                                    >
                                        Haz clic aquí para agregar el primero
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
