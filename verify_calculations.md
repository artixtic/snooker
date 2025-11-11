# Calculation Verification Report

Based on the SQL data from `snooker_pos.sql`, here's the detailed breakdown:

## Sales Data Analysis

### Sale 1 (RCP-20251111-0001) - Table 7 (Foosball)
- **Subtotal**: 51.00
- **Tax**: 0.00
- **Total**: 51.00
- **Items**: 1x Snickers (subtotal: 3.00, tax: NULL/0)
- **Table Charge**: 51.00 - 3.00 = **48.00**
- **Table Tax**: 0.00

### Sale 2 (RCP-20251111-0002) - Table 5 (PlayStation)
- **Subtotal**: 36.00
- **Tax**: 0.00
- **Total**: 36.00
- **Items**: 1x Snickers (subtotal: 3.00, tax: NULL/0)
- **Table Charge**: 36.00 - 3.00 = **33.00**
- **Table Tax**: 0.00

### Sale 3 (RCP-20251111-0003) - Table 2 (Snooker)
- **Subtotal**: 89.00
- **Tax**: 0.00
- **Total**: 89.00
- **Items**: 7x Water Bottle (subtotal: 14.00, tax: NULL/0)
- **Table Charge**: 89.00 - 14.00 = **75.00**
- **Table Tax**: 0.00

### Sale 4 (RCP-20251111-0004) - Table 3 (Table Tennis)
- **Subtotal**: 80.00
- **Tax**: 13.00
- **Total**: 93.00
- **Items**: 7x Snickers (subtotal: 21.00, tax: 4.00)
- **Table Charge**: 80.00 - 21.00 = **59.00**
- **Table Tax**: 13.00 - 4.00 = **9.00**

## Expected Report Values

### Game Totals (Table Charges WITHOUT tax):
- **Foosball**: 48.00 (1 session)
- **PlayStation**: 33.00 (1 session)
- **Snooker**: 75.00 (1 session)
- **Table Tennis**: 59.00 (1 session)
- **Games Total**: 48 + 33 + 75 + 59 = **215.00**

### Canteen Total (Items WITHOUT tax):
- Sale 1: 3.00
- Sale 2: 3.00
- Sale 3: 14.00
- Sale 4: 21.00
- **Canteen Total**: 3 + 3 + 14 + 21 = **41.00**

### Tax Breakdown:
- **Table Tennis Tax**: 9.00 (1 of 1 sessions)
- **Canteen Tax**: 4.00 (1 sale with tax)
- **Total Taxes**: 9 + 4 = **13.00**

### Totals:
- **Subtotal (Before Tax)**: 215 + 41 = **256.00**
- **Total Taxes**: **13.00**
- **Total Sales (With Tax)**: 51 + 36 + 89 + 93 = **269.00**
- **Verification**: 256 + 13 = **269.00** ✓

## Verification Result

All calculations are **CORRECT**:
- ✅ Game totals match expected values
- ✅ Canteen total matches expected value (41.00)
- ✅ Tax breakdown is correct
- ✅ Total sales calculation is correct
- ✅ Formula: Subtotal + Taxes = Total Sales ✓

