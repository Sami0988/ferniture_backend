const VAT_RATE = 0.15;
const WITHHOLDING_RATE = 0.03;
const WITHHOLDING_THRESHOLD = 10000;

export function calculatePurchaseTax(amountBeforeVat: number) {
  const vatAmount = round2(amountBeforeVat * VAT_RATE);
  const withholdingAmount =
    amountBeforeVat > WITHHOLDING_THRESHOLD
      ? round2(amountBeforeVat * WITHHOLDING_RATE)
      : 0;
  const totalAmount = round2(amountBeforeVat + vatAmount);

  return { vatAmount, withholdingAmount, totalAmount };
}

export function calculateProjectTax(priceBeforeVat: number) {
  const vatAmount = round2(priceBeforeVat * VAT_RATE);
  const totalPrice = round2(priceBeforeVat + vatAmount);
  return { vatAmount, totalPrice };
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}
