import 'package:flutter/material.dart';
import '../models/tenant_profile.dart';

class TenantMatchesScreen extends StatelessWidget {
  final TenantProfileModel profile;

  const TenantMatchesScreen({super.key, required this.profile});

  @override
  Widget build(BuildContext context) {
    const primaryTeal = Color(0xFF0F766E);

    final dummyMatches = [
      {
        'title': 'Spacious 2 BHK in ${profile.primaryLocality} near Tech Park',
        'price': '₹24,000/mo',
        'match': 95,
        'bhk': '2 BHK',
        'commute': '🏢 8 min to ${profile.officeName.isNotEmpty ? profile.officeName : "HITEC City"}',
        'locality': profile.primaryLocality,
      },
      {
        'title': '3 BHK Luxury Gated Society Apartment',
        'price': '₹32,000/mo',
        'match': 88,
        'bhk': '3 BHK',
        'commute': '🏢 14 min to ${profile.officeName.isNotEmpty ? profile.officeName : "HITEC City"}',
        'locality': profile.primaryLocality,
      },
      {
        'title': '1 BHK Fully Furnished Studio Flat',
        'price': '₹16,500/mo',
        'match': 82,
        'bhk': '1 BHK',
        'commute': '🏢 12 min to ${profile.officeName.isNotEmpty ? profile.officeName : "HITEC City"}',
        'locality': profile.primaryLocality,
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text('Matched in ${profile.primaryLocality}'),
        backgroundColor: primaryTeal,
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header summary
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.teal.shade800, Colors.teal.shade900],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '⚡ AI MATCHING ACTIVE',
                  style: TextStyle(
                    color: Colors.tealAccent,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Targeting: ${profile.primaryLocality}, ${profile.primaryCity}',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  'Budget: ₹${profile.budgetMin} – ₹${profile.budgetMax}/mo · Max ${profile.maxCommuteMinutes}m commute',
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Property Cards
          ...dummyMatches.map((m) {
            final score = m['match'] as int;
            return Card(
              margin: const EdgeInsets.only(bottom: 16),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          m['price'] as String,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: primaryTeal,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.emerald.shade50,
                            border: Border.all(color: Colors.emerald.shade200),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '$score% Match',
                            style: TextStyle(
                              color: Colors.emerald.shade800,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      m['title'] as String,
                      style: const TextStyle(
                          fontSize: 15, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.teal.shade50,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        m['commute'] as String,
                        style: const TextStyle(
                            color: primaryTeal,
                            fontSize: 12,
                            fontWeight: FontWeight.w600),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        icon: const Icon(Icons.chat, size: 16, color: Colors.white),
                        label: const Text('WhatsApp Owner (0% Brokerage)',
                            style: TextStyle(color: Colors.white)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF25D366),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
                        ),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Opening direct WhatsApp with owner...'),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
