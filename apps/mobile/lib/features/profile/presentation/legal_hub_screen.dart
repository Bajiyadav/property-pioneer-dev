import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../config/theme.dart';

class LegalHubScreen extends StatelessWidget {
  const LegalHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Legal & Platform Policies', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Info banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF0F766E).withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFF0F766E).withValues(alpha: 0.2)),
            ),
            child: const Row(
              children: [
                Icon(Icons.shield_outlined, color: Color(0xFF0F766E), size: 28),
                SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Seedha Properties Legal Hub',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F766E)),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Transparency, privacy protection, and zero brokerage across all services.',
                        style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Policy list card
          Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            elevation: 0,
            color: Colors.white,
            child: Column(
              children: [
                _policyTile(
                  context,
                  icon: Icons.description_outlined,
                  title: 'Terms of Service',
                  subtitle: 'Intermediary status, zero-brokerage model & user covenants',
                  route: '/legal/terms',
                ),
                const Divider(height: 1, indent: 56),
                _policyTile(
                  context,
                  icon: Icons.privacy_tip_outlined,
                  title: 'Privacy Policy',
                  subtitle: 'DPDP Act compliance, data protection & personal rights',
                  route: '/legal/privacy',
                ),
                const Divider(height: 1, indent: 56),
                _policyTile(
                  context,
                  icon: Icons.cookie_outlined,
                  title: 'Cookies & Storage Policy',
                  subtitle: 'Session tokens, location preferences & storage inventory',
                  route: '/legal/cookies',
                ),
                const Divider(height: 1, indent: 56),
                _policyTile(
                  context,
                  icon: Icons.currency_rupee_outlined,
                  title: 'Refund & Cancellation Policy',
                  subtitle: 'Free features, optional boost refunds & timeline standards',
                  route: '/legal/refunds',
                ),
                const Divider(height: 1, indent: 56),
                _policyTile(
                  context,
                  icon: Icons.rule_outlined,
                  title: 'Content Moderation Policy',
                  subtitle: 'Prohibited listings, anti-fraud rules & community reporting',
                  route: '/legal/moderation',
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Contact footer card
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: const Row(
              children: [
                Icon(Icons.mail_outline, color: Color(0xFF0F766E), size: 22),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Official Legal Grievances', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      Text('support@seedhaproperties.com', style: TextStyle(fontSize: 12, color: Color(0xFF0F766E), fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _policyTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required String route,
  }) {
    return ListTile(
      leading: Icon(icon, color: const Color(0xFF0F766E)),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
      subtitle: Text(subtitle, style: const TextStyle(fontSize: 11, color: Colors.grey)),
      trailing: const Icon(Icons.arrow_forward_ios, size: 13, color: Colors.grey),
      onTap: () => context.push(route),
    );
  }
}
