import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:seedha_properties_mobile/models/emi_estimate.dart';
import 'package:seedha_properties_mobile/models/lender_rate.dart';
import 'package:seedha_properties_mobile/features/loans/presentation/emi_calculator_sheet.dart';
import 'package:seedha_properties_mobile/features/loans/presentation/loan_callback_sheet.dart';

class HomeLoansScreen extends StatefulWidget {
  const HomeLoansScreen({super.key});

  @override
  State<HomeLoansScreen> createState() => _HomeLoansScreenState();
}

class _HomeLoansScreenState extends State<HomeLoansScreen> with SingleTickerProviderStateMixin {
  double _loanAmount = 5000000; // 50 Lakhs default
  late double _interestRate = defaultInterestRate;
  double _tenureYears = 20; // 20 years default

  late TabController _tabController;

  final _currencyFormat = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 0,
  );

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  EmiEstimate get _estimate => calculateEmi(
        principal: _loanAmount,
        annualRatePercent: _interestRate,
        tenureMonths: (_tenureYears * 12).round(),
      );

  int get _monthlyEmi => _estimate.monthlyEmi;
  int get _totalPayment => _estimate.totalPayment;
  int get _totalInterest => _estimate.totalInterest;

  String _formatCompactINR(double amount) => formatCompactInr(amount);

  /// Opens the call-back form, carrying the calculator's current state.
  ///
  /// This used to build its own form that validated the phone number, showed a
  /// success message and then discarded the lead — nothing was ever written.
  /// It now goes through [LoanCallBackSheet], which persists to
  /// `public.loan_enquiries` and only reports success once the row is stored.
  void _showInquirySheet() {
    showLoanCallBackSheet(
      context,
      loanAmount: _loanAmount,
      interestRate: _interestRate,
      tenureMonths: (_tenureYears * 12).round(),
      monthlyEmi: _monthlyEmi,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Home Loans & EMI', style: TextStyle(fontWeight: FontWeight.bold)),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.calculate_outlined), text: 'EMI Calculator'),
            Tab(icon: Icon(Icons.account_balance_outlined), text: 'Bank Offers'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 1: EMI Calculator
          SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Monthly EMI Output Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [theme.primaryColor, theme.primaryColor.withOpacity(0.8)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: theme.primaryColor.withOpacity(0.25),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      const Text(
                        'MONTHLY HOME LOAN EMI',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _currencyFormat.format(_monthlyEmi),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Total Interest', style: TextStyle(color: Colors.white70, fontSize: 11)),
                                Text(_formatCompactINR(_totalInterest.toDouble()),
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                const Text('Total Payable', style: TextStyle(color: Colors.white70, fontSize: 11)),
                                Text(_formatCompactINR(_totalPayment.toDouble()),
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Loan Amount Slider
                Text(
                  'Loan Amount: ${_formatCompactINR(_loanAmount)}',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                Slider(
                  value: _loanAmount,
                  min: 500000,
                  max: 50000000,
                  divisions: 99,
                  onChanged: (val) => setState(() => _loanAmount = val),
                ),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('₹5 Lakh', style: TextStyle(fontSize: 11, color: Colors.grey)),
                    Text('₹5 Crore', style: TextStyle(fontSize: 11, color: Colors.grey)),
                  ],
                ),
                const SizedBox(height: 20),

                // Interest Rate Slider
                Text(
                  'Interest Rate: ${_interestRate.toStringAsFixed(2)}% p.a.',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                Slider(
                  value: _interestRate,
                  min: minInterestRate,
                  max: maxInterestRate,
                  divisions: 90,
                  onChanged: (val) => setState(() => _interestRate = val),
                ),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('7.5%', style: TextStyle(fontSize: 11, color: Colors.grey)),
                    Text('12.0%', style: TextStyle(fontSize: 11, color: Colors.grey)),
                  ],
                ),
                const SizedBox(height: 20),

                // Tenure Slider
                Text(
                  'Loan Tenure: ${_tenureYears.toInt()} Years',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                Slider(
                  value: _tenureYears,
                  min: minTenureYears.toDouble(),
                  max: maxTenureYears.toDouble(),
                  divisions: maxTenureYears - minTenureYears,
                  onChanged: (val) => setState(() => _tenureYears = val),
                ),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('5 Years', style: TextStyle(fontSize: 11, color: Colors.grey)),
                    Text('30 Years', style: TextStyle(fontSize: 11, color: Colors.grey)),
                  ],
                ),
                const SizedBox(height: 28),

                // Apply Button
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    onPressed: _showInquirySheet,
                    icon: const Icon(Icons.verified_user_outlined),
                    label: const Text('Apply for Home Loan Assistance', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),

          // Tab 2: Partner Banks
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              ...lenderRates.map(_buildBankCard),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.withOpacity(0.2)),
                ),
                child: const Text(
                  'Disclaimer: $lenderRatesDisclaimer',
                  style: TextStyle(fontSize: 11, color: Colors.grey, height: 1.4),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBankCard(LenderRate lender) {
    final name = lender.name;
    final rates = lender.rateRange;
    final fee = lender.processingFee;
    final highlight = lender.highlight;
    final color = lender.accent;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: color,
                  radius: 16,
                  child: Text(
                    name.substring(0, 1),
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    name,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                ),
              ],
            ),
            const Divider(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Interest Rate (Indicative)', style: TextStyle(fontSize: 11, color: Colors.grey)),
                    Text(rates, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('Processing Fee', style: TextStyle(fontSize: 11, color: Colors.grey)),
                    Text(fee, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                '✓ $highlight',
                style: const TextStyle(fontSize: 11, color: Colors.green, fontWeight: FontWeight.w600),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: _showInquirySheet,
                child: const Text('Apply via this Bank'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
