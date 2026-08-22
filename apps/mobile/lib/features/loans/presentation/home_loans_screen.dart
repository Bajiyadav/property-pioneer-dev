import 'dart:math';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class HomeLoansScreen extends StatefulWidget {
  const HomeLoansScreen({super.key});

  @override
  State<HomeLoansScreen> createState() => _HomeLoansScreenState();
}

class _HomeLoansScreenState extends State<HomeLoansScreen> with SingleTickerProviderStateMixin {
  double _loanAmount = 5000000; // 50 Lakhs default
  double _interestRate = 8.5; // 8.5% p.a.
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

  int get _monthlyEmi {
    if (_loanAmount <= 0 || _tenureYears <= 0) return 0;
    if (_interestRate <= 0) return (_loanAmount / (_tenureYears * 12)).round();

    final r = _interestRate / 12 / 100;
    final n = _tenureYears * 12;
    final factor = pow(1 + r, n);
    final emi = (_loanAmount * r * factor) / (factor - 1);
    return emi.round();
  }

  int get _totalPayment => (_monthlyEmi * _tenureYears * 12).round();
  int get _totalInterest => max(0, _totalPayment - _loanAmount.round());

  String _formatCompactINR(double amount) {
    if (amount >= 10000000) {
      final cr = amount / 10000000;
      return '₹${cr.toStringAsFixed(cr % 1 == 0 ? 0 : 2)} Cr';
    }
    if (amount >= 100000) {
      final l = amount / 100000;
      return '₹${l.toStringAsFixed(l % 1 == 0 ? 0 : 2)} L';
    }
    return _currencyFormat.format(amount);
  }

  void _showInquirySheet() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom,
        ),
        child: Container(
          decoration: BoxDecoration(
            color: Theme.of(ctx).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Home Loan Assistance',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                'Get connected with top bank mortgage officers for instant pre-approval and best interest rates.',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: nameCtrl,
                decoration: InputDecoration(
                  labelText: 'Full Name',
                  prefixIcon: const Icon(Icons.person_outline),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phoneCtrl,
                keyboardType: TextInputType.phone,
                maxLength: 10,
                decoration: InputDecoration(
                  labelText: 'Mobile Number',
                  prefixText: '+91 ',
                  prefixIcon: const Icon(Icons.phone_outlined),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () {
                    if (phoneCtrl.text.length < 10) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Please enter valid 10-digit phone number')),
                      );
                      return;
                    }
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Request received! Our loan advisor will call you shortly.'),
                        backgroundColor: Colors.green,
                      ),
                    );
                  },
                  child: const Text('Request Free Call Back', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
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
                  'Interest Rate: ${_interestRate.toStringAsFixed(1)}% p.a.',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                Slider(
                  value: _interestRate,
                  min: 7.5,
                  max: 15.0,
                  divisions: 75,
                  onChanged: (val) => setState(() => _interestRate = val),
                ),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('7.5%', style: TextStyle(fontSize: 11, color: Colors.grey)),
                    Text('15.0%', style: TextStyle(fontSize: 11, color: Colors.grey)),
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
                  min: 1,
                  max: 30,
                  divisions: 29,
                  onChanged: (val) => setState(() => _tenureYears = val),
                ),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('1 Year', style: TextStyle(fontSize: 11, color: Colors.grey)),
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
              _buildBankCard('State Bank of India (SBI)', '8.50% - 9.45%', '0.35%', 'Zero Prepayment Penalty', Colors.blue),
              _buildBankCard('HDFC Bank', '8.75% - 9.65%', '0.50%', 'Instant Digital Approval', Colors.red),
              _buildBankCard('ICICI Bank', '8.75% - 9.80%', '0.50%', 'Express 3-step Sanction', Colors.orange),
              _buildBankCard('Axis Bank', '8.90% - 9.85%', '1.00%', '12 EMI Waiver on Timely Payment', Colors.purple),
              _buildBankCard('Bank of Baroda', '8.40% - 9.30%', 'Nil', 'Lowest Benchmark Rate', Colors.amber[800]!),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.withOpacity(0.2)),
                ),
                child: const Text(
                  'Disclaimer: Interest rates and terms shown are indicative based on publicly available data as of August 2026. Final approval, processing fees, and interest rates are subject to individual credit assessment and bank sanction.',
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

  Widget _buildBankCard(String name, String rates, String fee, String highlight, Color color) {
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
