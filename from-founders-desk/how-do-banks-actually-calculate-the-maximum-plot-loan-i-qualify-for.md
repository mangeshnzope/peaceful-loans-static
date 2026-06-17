[![Peaceful Loans](../../assets/logo-horizontal.png)](/index.html)
    
    
      
        [
          
          Book a Free Call
        ](https://forms.zohopublic.in/mangeshpeacef1/form/Contactforsupport/formperma/_ps6Hq-7OvODRTnKowl1_FxyIIKmnPIywn1z6WV7i4M)
        [
          
          WhatsApp Us
        ](https://forms.zohopublic.in/mangeshpeacef1/form/WhatsAppButtonForm/formperma/F2z-Z2bBLbkttGWHBPPvrqSwlSXzd_WnD4sUAWNnjh4)
      
      
        From Founder's Desk
        5 May 2026
      
    
  

  
  
    Product Strategy · Expert Insight
    

# How Do Banks Actually Calculate the Maximum Plot Loan I Qualify For?

  

  
    ![Mangesh Zope](../../assets/founder.jpeg)
    
      

Mangesh Zope

      

Founder, Peaceful Loans · IIM Calcutta Alumnus

    
  

  
  

A senior product manager in Bengaluru called us last quarter, in pre-application research mode. She had used three different bank plot loan calculators with the same inputs (₹3.4 lakh/month income, no existing EMIs, 750+ CIBIL) and gotten three wildly different maximum loan estimates — ₹1.65 crore, ₹2.10 crore, and ₹2.55 crore. *"Mangesh, what's the actual formula? Why are calculators so different?"*

The honest answer is — banks use the same fundamental framework but with different assumptions about FOIR ceilings, tenure, rate, and discount factors. The variations across calculators reflect different bank policies, not different math. **Understanding the actual formula** lets you cross-check any calculator estimate and predict your realistic eligibility before you apply.

This post is the practical map of how banks compute maximum plot loan. The actual formulas, the inputs that vary, and how to estimate your eligibility accurately.

## The Core Formula

At its heart, plot loan maximum is computed in two steps:

### Step 1: Calculate EMI Capacity

**Eligible EMI = (Net Monthly Income × FOIR Ceiling%) − Existing EMIs**

For ₹3.4 lakh/month income with no existing EMIs and 50% FOIR:

- EMI capacity = ₹3.4L × 50% = ₹1.7 lakh/month

### Step 2: Convert EMI to Maximum Loan

Using the standard EMI formula:

**Maximum Loan = EMI × [(1+r)ⁿ − 1] / [r × (1+r)ⁿ]**

Where:

- r = monthly interest rate (annual ÷ 12)

- n = tenure in months

For ₹1.7 lakh EMI capacity at 9.0% over 15 years (180 months):

- Maximum loan = ~₹1.68 crore

### Step 3: Apply LTV Cap

Whatever loan amount the income supports, the actual loan is capped at 70% of plot value:

- ₹2 crore plot → max ₹1.40 crore loan

- ₹3 crore plot → max ₹2.10 crore loan

- ₹4 crore plot → max ₹2.80 crore loan

The smaller of (Step 2 income-based eligibility) or (Step 3 LTV cap) becomes your actual maximum.

## What Each Variable Is and How It Varies

The four variables that drive your maximum:

### Variable 1: Net Monthly Income

**For salaried:**

- Net of TDS, PF, professional tax, mediclaim premiums

- After all standard deductions

- Excluding one-time bonuses (counted separately at 50-70%)

- Excluding unvested equity

**For self-employed:**

- Net taxable income from ITR

- After 20-30% conservative haircut for plot loans

- 3-year average preferred

**Typical bank treatment of variable components:**

| Income Component | Bank Treatment |
| --- | --- |
| Fixed salary (base) | 100% counted |
| Annual bonus | 50-70% of 24-month average |
| RSU vesting | 30-50% of 24-month average |
| Performance pay | 30-60% (varies) |
| Foreign currency salary (NRI) | Converted at recent average, slightly discounted |
| Self-employed ITR | After 20-30% discount |

### Variable 2: FOIR Ceiling

The percentage of income banks allow for total EMI commitment:

| Income Bracket | Typical FOIR for Plot Loans |
| --- | --- |
| Up to ₹50,000/month | 40-45% |
| ₹50K-1 lakh/month | 45-55% |
| ₹1L-3 lakh/month | 50-60% |
| ₹3L-5 lakh/month | 55-65% |
| ₹5L+ /month | 60-70% |

**Bank-specific variations:**

- HDFC: typically conservative on FOIR

- ICICI: more aggressive for premium customers

- SBI: standard PSU FOIR ceilings

- NBFCs: often more flexible (higher FOIR)

For our Bengaluru product manager at ₹3.4L income:

- HDFC FOIR: ~55% → EMI capacity ₹1.87L

- ICICI FOIR: ~60% → EMI capacity ₹2.04L

- SBI FOIR: ~55% → EMI capacity ₹1.87L

- The 5 percentage point difference between banks moves eligibility ₹15-20 lakh

### Variable 3: Tenure

Plot loan tenure caps:

- SBI: maximum 10 years

- HDFC: maximum 15 years

- ICICI: maximum 20 years

- LIC HFL: maximum 15 years

- PNB Housing: maximum 20 years

- Axis: maximum 15 years

- Bajaj HFL: maximum 15 years

For same EMI capacity:

- 10-year tenure: smallest loan amount

- 15-year tenure: medium loan amount

- 20-year tenure: largest loan amount

For ₹1.7L EMI capacity at 9.0%:

- 10-year tenure: max ~₹1.34 crore

- 15-year tenure: max ~₹1.68 crore

- 20-year tenure: max ~₹1.89 crore

The 5-year tenure difference between SBI (10 years) and ICICI (20 years) can change eligibility by 30-40%.

### Variable 4: Interest Rate

Plot loan rates April 2026:

- HDFC: 8.50-9.50%

- ICICI: 8.50-9.25%

- SBI Realty: 9.45-9.85%

- LIC HFL: 9.20-10.50%

- PNB Housing: 8.99-10.50%

The rate affects EMI calculation:

- Lower rate → smaller EMI for same loan

- Lower rate → larger maximum loan for same EMI capacity

For ₹1.7L EMI capacity over 15 years:

- 8.50% rate: max ~₹1.72 crore

- 9.00% rate: max ~₹1.68 crore

- 9.50% rate: max ~₹1.64 crore

50 bps difference: ~₹4 lakh impact on maximum loan.

## Why Calculators Show Different Numbers

Three common reasons calculator estimates vary:

### Reason 1: Different FOIR Assumption

Some calculators default to 50%, others 55%, 60%, or 65%. Same income, different FOIR = different eligibility.

For our Bengaluru product manager at ₹3.4L:

- Calculator at 50% FOIR: ₹1.7L EMI capacity → ₹1.68 crore eligibility

- Calculator at 60% FOIR: ₹2.04L EMI capacity → ₹2.02 crore eligibility

- Calculator at 65% FOIR: ₹2.21L EMI capacity → ₹2.18 crore eligibility

The 15 percentage point spread across calculators creates her ₹50 lakh+ variation.

### Reason 2: Different Tenure Assumption

Some calculators default to 15 years, others 20. For same EMI capacity:

- 15-year tenure assumption: lower loan

- 20-year tenure assumption: higher loan

### Reason 3: Different Rate Assumption

Some calculators use bank's "best" rate (8.50%); others use mid-range (9.25%). Variations create different EMI calculations.

### The Practical Result

For our Bengaluru product manager:

- **Calculator A (50% FOIR, 15yr, 9.5%):** ~₹1.65 crore

- **Calculator B (55% FOIR, 18yr, 9.0%):** ~₹2.10 crore

- **Calculator C (60% FOIR, 20yr, 8.85%):** ~₹2.55 crore

The ₹90 lakh spread between calculator results entirely reflects different assumptions, not different math.

## How to Estimate Your Realistic Maximum

A practical 4-step approach:

### Step 1: Compute Conservative EMI Capacity

Take your net monthly income and apply 50% FOIR (conservative baseline):

- ₹3.4L income × 50% = ₹1.7L EMI capacity

This is your minimum likely capacity.

### Step 2: Compute Aggressive EMI Capacity

Apply 60% FOIR (premium customer treatment):

- ₹3.4L income × 60% = ₹2.04L EMI capacity

This is your maximum likely capacity.

### Step 3: Convert Both to Loan Amounts

Use 15-year tenure at 9.25% as middle assumption:

- ₹1.7L EMI: max ~₹1.65 crore loan

- ₹2.04L EMI: max ~₹1.99 crore loan

Your realistic eligibility range: **₹1.65-2.0 crore**.

### Step 4: Apply LTV Cap

For your target plot value:

- ₹2 crore plot at 70% LTV: max ₹1.40 crore (binding constraint)

- ₹2.5 crore plot at 70% LTV: max ₹1.75 crore (LTV vs income borderline)

- ₹3 crore plot at 70% LTV: max ₹2.10 crore (income binds)

The smaller of (your eligibility range) or (LTV cap) is your actual ceiling.

## What Affects Where in the Range You Land

Five factors:

### Factor 1: Premium Customer Status

- HNI premium banking → lands in upper half of range

- Standard customer → lands in lower half

### Factor 2: Employer Category

- Cat A (top tech, consulting) → upper half

- Cat C (smaller employers) → lower half

### Factor 3: CIBIL Score

- 800+ → upper half

- 700-749 → lower half

- Below 700 → below typical range entirely

### Factor 4: Employment Stability

- 5+ years at current employer → upper half

- Recent change (under 12 months) → lower half

### Factor 5: Existing Loan Position

- No existing loans → upper half

- Significant existing EMIs → may push below range entirely

## What Most Calculators Don't Show

Three considerations calculators typically miss:

### Hidden Factor 1: Total Cost Beyond EMI

Calculators compute loan amount but don't show:

- Processing fee, legal/technical, mortgage creation costs

- ~5% additional cost on top of loan amount over loan life

- We covered this in hidden costs post (#123)

### Hidden Factor 2: Construction Phase Cash Flow

Calculators show plot loan EMI but don't account for:

- Construction loan EMI 18-30 months later

- Combined commitment may be 60-80K higher than plot loan EMI alone

### Hidden Factor 3: Realistic vs Maximum

Calculators show maximum, not optimal. For HNI customers, optimal loan is usually 70-85% of maximum, leaving margin for:

- Construction phase commitment

- Other financial goals

- Unexpected needs

We covered this in maximum loan amount post (#103).

## What I Told the Bengaluru Product Manager

For the borrower I mentioned at the start, we ran the actual analysis:

**Her situation:**

- ₹3.4L net income

- No existing EMIs

- 750+ CIBIL

- Premium employer (Cat A)

- 5 years tenure at current employer

- Targeted ₹2.4 crore plot

**Realistic eligibility range:**

- 50% FOIR baseline: ₹1.65 crore

- 60% FOIR premium: ₹2.05 crore

- 65% FOIR aggressive (with HNI banking relationship): ₹2.20 crore

**LTV check:**

- ₹2.4 crore plot at 70% LTV: max ₹1.68 crore loan

- LTV is binding constraint, not income

**Practical conclusion:**

- Maximum loan available: ₹1.68 crore (LTV-binding)

- Income comfortably supports this (50-60% FOIR)

- Down payment needed: ₹72 lakh + closing costs ₹40 lakh = ₹1.12 crore upfront

We applied to HDFC and ICICI in parallel:

- HDFC offered 9.10% with 15-year tenure

- ICICI offered 9.00% with 20-year tenure

- She took HDFC at 8.95% (after negotiation using ICICI offer)

**Final structure:** ₹1.68 crore loan at 8.95% over 15 years. EMI ₹1.70 lakh — exactly at her premium FOIR ceiling. Comfortable.

The three calculator estimates she'd been confused about all reflected different bank policies, not different math. Understanding the framework let her predict her realistic eligibility before applying.

## Peaceful Loans's Advise

Banks calculate maximum plot loan using a consistent framework: Eligible EMI = (Income × FOIR%) − existing EMIs, then convert EMI to loan amount using rate and tenure, finally cap by 70% LTV on plot value.

Calculator estimates vary because they use different assumptions for:

- **FOIR ceiling** (50% conservative to 65% aggressive)

- **Tenure** (10-20 years)

- **Interest rate** (8.50-9.85%)

Same inputs, different assumptions = different results.

To estimate your realistic eligibility:

1. Compute conservative (50% FOIR) and aggressive (60% FOIR) EMI capacity

2. Convert each to loan amount using 15-year tenure at 9.25%

3. Your realistic range is between these

4. Apply 70% LTV cap on plot value

5. Smaller of (income range) or (LTV cap) is your actual maximum

Five factors determine where in the range you land: premium customer status, employer category, CIBIL score, employment stability, and existing loan position.

For HNI customers, **LTV (70%) usually binds before income does**. Maximum plot loan is typically plot value × 70%, regardless of income exceeding that.

Optimal loan is usually 70-85% of maximum eligibility, preserving capacity for construction phase, other financial goals, and unexpected needs.

If you want help estimating your specific realistic plot loan eligibility — and identifying which bank's policies best fit your profile — that is exactly the kind of conversation we have. **Book a free advisory call.** Better to know your realistic ceiling upfront than to be surprised by the eligibility math when you apply.

  

  
  
    Before You Sign Anything
    

## Talk to us first. It's free.

    

Free advisory call. 30 minutes. No strings. Just the unvarnished truth about your loan agreement — from someone who works only for you.

    
      [
        
        Book a Free Call
      ](https://forms.zohopublic.in/mangeshpeacef1/form/Contactforsupport/formperma/_ps6Hq-7OvODRTnKowl1_FxyIIKmnPIywn1z6WV7i4M)
      [
        
        WhatsApp Us
      ](https://forms.zohopublic.in/mangeshpeacef1/form/WhatsAppButtonForm/formperma/F2z-Z2bBLbkttGWHBPPvrqSwlSXzd_WnD4sUAWNnjh4)
    
  

  
  
    
      peaceful-loans.com
       · 
      Unbiased Advisory · IIM Calcutta Alumnus Initiative
    
    © 2026 Peaceful Loans