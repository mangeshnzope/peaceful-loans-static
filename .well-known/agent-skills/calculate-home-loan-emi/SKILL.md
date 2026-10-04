# Calculate Home Loan EMI

Calculate monthly EMI, total interest, and complete repayment breakdown for Indian home loans.

## Formula
Monthly EMI is calculated using standard reducing balance formula:
`EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)`
where:
- `P` = Principal loan amount in INR
- `r` = Monthly interest rate (`Annual Rate / 12 / 100`)
- `n` = Loan tenure in months (`Tenure in Years * 12`)

## Usage
Agents can run this tool in the browser via WebMCP `calculate_home_loan_emi` or calculate directly:
- Principal: ₹2,00,00,000 (₹2 Crore)
- Interest Rate: 8.40% p.a.
- Tenure: 20 Years (240 months)
- Monthly EMI: ~₹1,72,280
- Total Interest: ~₹2,13,47,200
- Total Repayment: ~₹4,13,47,200
