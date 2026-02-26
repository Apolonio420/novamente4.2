"use client";

import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
    Font,
} from "@react-pdf/renderer";
import { QuoteData } from "@/lib/quote-schema";
import { format } from "date-fns";

// Types
interface QuotePdfDocumentProps {
    data: QuoteData;
    quoteNumber: string;
}

// Styles
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: "Helvetica",
        color: "#333",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
        borderBottom: 1,
        borderBottomColor: "#EEE",
        paddingBottom: 20,
    },
    logoContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    logo: {
        width: 60,
        height: 60,
        marginRight: 10,
    },
    companyName: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#000",
    },
    headerContact: {
        textAlign: "right",
    },
    headerLabel: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#666",
        marginBottom: 4,
    },
    clientSection: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: "#F9F9F9",
        borderRadius: 4,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        marginBottom: 8,
        color: "#000",
        textTransform: "uppercase",
    },
    clientRow: {
        flexDirection: "row",
        marginBottom: 4,
    },
    clientLabel: {
        width: 80,
        fontWeight: "bold",
        color: "#666",
    },
    table: {
        width: "auto",
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#000",
        color: "#FFF",
        fontWeight: "bold",
        padding: 6,
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#EEE",
        paddingVertical: 6,
        paddingHorizontal: 6,
    },
    col1: { width: "8%" },  // Cant
    col2: { width: "25%" }, // Prenda
    col3: { width: "12%" }, // Color
    col4: { width: "10%" }, // Talle
    col5: { width: "10%" }, // Doble
    col6: { width: "15%", textAlign: "right" }, // Unit
    col7: { width: "20%", textAlign: "right" }, // Subtotal

    totalsSection: {
        alignItems: "flex-end",
        marginTop: 10,
    },
    totalRow: {
        flexDirection: "row",
        marginBottom: 4,
        width: 200,
        justifyContent: "space-between",
        paddingRight: 6,
    },
    totalLabel: {
        fontWeight: "bold",
        color: "#666",
    },
    grandTotal: {
        flexDirection: "row",
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 2,
        borderTopColor: "#000",
        width: 200,
        justifyContent: "space-between",
        paddingRight: 6,
    },
    grandTotalLabel: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#000",
    },
    grandTotalValue: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#000",
    },
    footer: {
        position: "absolute",
        bottom: 40,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: "#EEE",
        paddingTop: 10,
        textAlign: "center",
        color: "#999",
        fontSize: 8,
    },
});

// Helper for currency formatting
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export const QuotePdfDocument: React.FC<QuotePdfDocumentProps> = ({
    data,
    quoteNumber,
}) => {
    const subtotalGeneral = data.items.reduce(
        (acc, item) => acc + item.quantity * item.unitPrice,
        0
    );
    const totalFinal = subtotalGeneral + data.shippingCost;

    return (
        <Document title={`Presupuesto - ${data.clientName}`}>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Image src="public/logo.png" style={styles.logo} />
                        <View>
                            <Text style={styles.companyName}>NovaMente</Text>
                            <Text>Estilo con propósito</Text>
                        </View>
                    </View>
                    <View style={styles.headerContact}>
                        <Text style={styles.headerLabel}>PRESUPUESTO {quoteNumber}</Text>
                        <Text>Fecha: {format(new Date(), "dd/MM/yyyy")}</Text>
                        <Text>Email: contact@novamente.ar</Text>
                        <Text>Tel: +54 9 11 6274-7588</Text>
                    </View>
                </View>

                {/* Client Info */}
                <View style={styles.clientSection}>
                    <Text style={styles.sectionTitle}>Datos del Cliente</Text>
                    <View style={styles.clientRow}>
                        <Text style={styles.clientLabel}>Cliente:</Text>
                        <Text>{data.clientName}</Text>
                    </View>
                    {data.clientContact && (
                        <View style={styles.clientRow}>
                            <Text style={styles.clientLabel}>Contacto:</Text>
                            <Text>{data.clientContact}</Text>
                        </View>
                    )}
                    {data.observations && (
                        <View style={styles.clientRow}>
                            <Text style={styles.clientLabel}>Obs:</Text>
                            <Text>{data.observations}</Text>
                        </View>
                    )}
                </View>

                {/* Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.col1}>Cant</Text>
                        <Text style={styles.col2}>Prenda</Text>
                        <Text style={styles.col3}>Color</Text>
                        <Text style={styles.col4}>Talle</Text>
                        <Text style={styles.col5}>Doble</Text>
                        <Text style={styles.col6}>Precio Unit</Text>
                        <Text style={styles.col7}>Subtotal</Text>
                    </View>
                    {data.items.map((item, index) => (
                        <View key={index} style={styles.tableRow} wrap={false}>
                            <Text style={styles.col1}>{item.quantity}</Text>
                            <Text style={styles.col2}>{item.product}</Text>
                            <Text style={styles.col3}>{item.color || "-"}</Text>
                            <Text style={styles.col4}>{item.size || "-"}</Text>
                            <Text style={styles.col5}>{item.doublePrint ? "Sí" : "No"}</Text>
                            <Text style={styles.col6}>{formatCurrency(item.unitPrice)}</Text>
                            <Text style={styles.col7}>
                                {formatCurrency(item.quantity * item.unitPrice)}
                            </Text>
                        </View>
                    ))}
                    {data.items.length === 0 && (
                        <View style={styles.tableRow}>
                            <Text style={{ width: "100%", textAlign: "center", color: "#666" }}>
                                No hay items cargados
                            </Text>
                        </View>
                    )}
                </View>

                {/* Totals */}
                <View style={styles.totalsSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Subtotal:</Text>
                        <Text>{formatCurrency(subtotalGeneral)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Envío:</Text>
                        <Text>{formatCurrency(data.shippingCost)}</Text>
                    </View>
                    <View style={styles.grandTotal}>
                        <Text style={styles.grandTotalLabel}>TOTAL:</Text>
                        <Text style={styles.grandTotalValue}>{formatCurrency(totalFinal)}</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>
                        Validez 7 días. Producción on-demand. Tiempos a coordinar.
                    </Text>
                    <Text style={{ marginTop: 4 }}>
                        NovaMente | www.novamente.ar | contact@novamente.ar
                    </Text>
                </View>
            </Page>
        </Document>
    );
};
