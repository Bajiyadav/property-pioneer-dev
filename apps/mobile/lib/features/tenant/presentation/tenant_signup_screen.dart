import 'package:flutter/material.dart';
import '../models/tenant_profile.dart';
import 'tenant_matches_screen.dart';

class TenantSignUpScreen extends StatefulWidget {
  const TenantSignUpScreen({super.key});

  @override
  State<TenantSignUpScreen> createState() => _TenantSignUpScreenState();
}

class _TenantSignUpScreenState extends State<TenantSignUpScreen> {
  int _currentStep = 1;

  final TextEditingController _phoneCtrl =
      TextEditingController(text: '9876543210');
  final TextEditingController _otpCtrl = TextEditingController(text: '123456');
  final TextEditingController _nameCtrl =
      TextEditingController(text: 'Rahul Sharma');
  final TextEditingController _emailCtrl =
      TextEditingController(text: 'rahul.sharma@example.com');
  final TextEditingController _companyCtrl =
      TextEditingController(text: 'Google India');
  final TextEditingController _professionCtrl =
      TextEditingController(text: 'Software Engineer');
  final TextEditingController _officeCtrl =
      TextEditingController(text: 'HITEC City Phase 2');

  String _city = 'Hyderabad';
  String _locality = 'Madhapur';
  int _budgetMin = 15000;
  int _budgetMax = 35000;
  final List<String> _preferredBhk = ['2 BHK', '3 BHK'];
  final String _furnishing = 'semi-furnished';
  bool _isVeg = false;
  bool _petsAllowed = false;
  final int _maxCommute = 30;

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _otpCtrl.dispose();
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _companyCtrl.dispose();
    _professionCtrl.dispose();
    _officeCtrl.dispose();
    super.dispose();
  }

  void _submitProfile() {
    final profile = TenantProfileModel(
      phoneNumber: _phoneCtrl.text.trim(),
      fullName: _nameCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      companyName: _companyCtrl.text.trim(),
      profession: _professionCtrl.text.trim(),
      budgetMin: _budgetMin,
      budgetMax: _budgetMax,
      preferredBhk: _preferredBhk,
      moveInDate: DateTime.now().add(const Duration(days: 15)).toIso8601String(),
      isVegetarian: _isVeg,
      petsAllowed: _petsAllowed,
      preferredFurnishing: _furnishing,
      primaryCity: _city,
      primaryLocality: _locality,
      officeName: _officeCtrl.text.trim(),
      maxCommuteMinutes: _maxCommute,
      profileCompleteness: 90,
    );

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => TenantMatchesScreen(profile: profile),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const primaryTeal = Color(0xFF0F766E);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Tenant Match Profile ($_currentStep/4)',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Progress Bar
            LinearProgressIndicator(
              value: _currentStep / 4,
              backgroundColor: Colors.grey.shade200,
              valueColor: const AlwaysStoppedAnimation<Color>(primaryTeal),
              minHeight: 6,
            ),
            const SizedBox(height: 24),

            // Step 1: Phone OTP
            if (_currentStep == 1) ...[
              const Text(
                'Verify Your Mobile Number',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Direct owner marketplace requires a verified phone number.',
                style: TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Phone Number',
                  prefixText: '+91 ',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _otpCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Enter OTP (Demo: 123456)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryTeal,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () => setState(() => _currentStep = 2),
                  child: const Text(
                    'Verify & Continue',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white),
                  ),
                ),
              ),
            ],

            // Step 2: Basic Info
            if (_currentStep == 2) ...[
              const Text(
                'Personal & Professional Details',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _nameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Full Name *',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _emailCtrl,
                decoration: const InputDecoration(
                  labelText: 'Email Address *',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _companyCtrl,
                decoration: const InputDecoration(
                  labelText: 'Company *',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _professionCtrl,
                decoration: const InputDecoration(
                  labelText: 'Profession *',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  OutlinedButton(
                    onPressed: () => setState(() => _currentStep = 1),
                    child: const Text('Back'),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryTeal,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      onPressed: () => setState(() => _currentStep = 3),
                      child: const Text('Continue to Location',
                          style: TextStyle(color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ],

            // Step 3: Mandatory Location
            if (_currentStep == 3) ...[
              const Text(
                'Where Do You Want To Rent? *',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.teal.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'Mandatory Location: All listings and match scores are strictly calculated against your primary locality.',
                  style: TextStyle(color: primaryTeal, fontSize: 13),
                ),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _city,
                decoration: const InputDecoration(
                  labelText: 'Primary Metro City *',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'Hyderabad', child: Text('Hyderabad')),
                  DropdownMenuItem(value: 'Bengaluru', child: Text('Bengaluru')),
                  DropdownMenuItem(value: 'Mumbai', child: Text('Mumbai')),
                  DropdownMenuItem(value: 'Pune', child: Text('Pune')),
                ],
                onChanged: (v) => setState(() => _city = v ?? 'Hyderabad'),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _locality,
                decoration: const InputDecoration(
                  labelText: 'Primary Locality *',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'Madhapur', child: Text('Madhapur')),
                  DropdownMenuItem(
                      value: 'Gachibowli', child: Text('Gachibowli')),
                  DropdownMenuItem(value: 'Kondapur', child: Text('Kondapur')),
                  DropdownMenuItem(
                      value: 'Hitech City', child: Text('Hitech City')),
                  DropdownMenuItem(
                      value: 'Financial District',
                      child: Text('Financial District')),
                ],
                onChanged: (v) => setState(() => _locality = v ?? 'Madhapur'),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _officeCtrl,
                decoration: const InputDecoration(
                  labelText: 'Daily Office / Tech Park Hub',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  OutlinedButton(
                    onPressed: () => setState(() => _currentStep = 2),
                    child: const Text('Back'),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryTeal,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      onPressed: () => setState(() => _currentStep = 4),
                      child: const Text('Continue to Preferences',
                          style: TextStyle(color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ],

            // Step 4: Preferences & Budget
            if (_currentStep == 4) ...[
              const Text(
                'Budget & Living Preferences',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              Text(
                'Monthly Rent Budget: ₹$_budgetMin – ₹$_budgetMax',
                style:
                    const TextStyle(fontWeight: FontWeight.bold, color: primaryTeal),
              ),
              RangeSlider(
                values: RangeValues(_budgetMin.toDouble(), _budgetMax.toDouble()),
                min: 5000,
                max: 80000,
                divisions: 75,
                activeColor: primaryTeal,
                onChanged: (r) {
                  setState(() {
                    _budgetMin = r.start.round();
                    _budgetMax = r.end.round();
                  });
                },
              ),
              const SizedBox(height: 16),
              SwitchListTile(
                title: const Text('Strict Vegetarian Landlord Matching'),
                value: _isVeg,
                activeColor: primaryTeal,
                onChanged: (v) => setState(() => _isVeg = v),
              ),
              SwitchListTile(
                title: const Text('Pet-Friendly Home Required'),
                value: _petsAllowed,
                activeColor: primaryTeal,
                onChanged: (v) => setState(() => _petsAllowed = v),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryTeal,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: _submitProfile,
                  child: const Text(
                    'Complete Profile & View Matches 🚀',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
