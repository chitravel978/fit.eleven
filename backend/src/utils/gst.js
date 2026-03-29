/**
 * India GST: intra-state split CGST + SGST (half each of total GST rate).
 * gstPercent is the total GST (e.g. 12 or 18).
 */
export function calculateGstBreakdown(subtotalAfterDiscount, gstPercent) {
  const rate = gstPercent / 100;
  const taxableAmount = subtotalAfterDiscount;
  const totalGst = Math.round(taxableAmount * rate * 100) / 100;
  const half = Math.round((totalGst / 2) * 100) / 100;
  const grandTotal = Math.round((taxableAmount + totalGst) * 100) / 100;
  return {
    subtotal: taxableAmount,
    gstPercent,
    cgst: half,
    sgst: Math.round((totalGst - half) * 100) / 100,
    totalGst,
    grandTotal,
  };
}

/** Weighted average GST % from line items (each line may have different gstRate). */
export function computeOrderGstFromItems(items) {
  let sub = 0;
  let gstWeighted = 0;
  for (const line of items) {
    const lineSub = line.price * line.quantity;
    sub += lineSub;
    gstWeighted += lineSub * (line.gstRate || 18);
  }
  if (sub <= 0) return { effectiveGstPercent: 18, subtotal: 0 };
  const effectiveGstPercent = Math.round((gstWeighted / sub) * 10) / 10;
  const rounded = [12, 18].includes(Math.round(effectiveGstPercent))
    ? Math.round(effectiveGstPercent)
    : effectiveGstPercent >= 15
      ? 18
      : 12;
  return { effectiveGstPercent: rounded, subtotal: Math.round(sub * 100) / 100 };
}
