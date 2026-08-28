import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../config/theme.dart';

class PolicySection {
  final String heading;
  final String content;
  final List<String>? bullets;

  const PolicySection({
    required this.heading,
    required this.content,
    this.bullets,
  });
}

class LegalPolicyData {
  final String title;
  final String effectiveDate;
  final String summary;
  final String canonicalUrl;
  final List<PolicySection> sections;

  const LegalPolicyData({
    required this.title,
    required this.effectiveDate,
    required this.summary,
    required this.canonicalUrl,
    required this.sections,
  });
}

class LegalPolicyScreen extends StatelessWidget {
  final String policyType;

  const LegalPolicyScreen({super.key, required this.policyType});

  LegalPolicyData _getPolicyData() {
    switch (policyType.toLowerCase()) {
      case 'cookies':
      case 'cookie-policy':
        return const LegalPolicyData(
          title: 'Cookie & Storage Policy',
          effectiveDate: '28 August 2026',
          canonicalUrl: 'https://seedhaproperties.com/cookie-policy',
          summary:
              'Seedha Properties uses secure cookies and local device storage strictly to operate the platform securely, remember your location choices, and keep you signed in. We do not use third-party advertising cookies or cross-site tracking pixels.',
          sections: [
            PolicySection(
              heading: '1. What Are Storage Technologies?',
              content:
                  'Cookies and device storage allow our app and website to operate smoothly by remembering your session, chosen State and City, and shortlisted properties without asking you to re-authenticate on every screen.',
            ),
            PolicySection(
              heading: '2. Technologies We Use',
              content: 'Our platform strictly utilizes functional, necessary storage:',
              bullets: [
                'Authentication & Session: Keeps your account securely signed in.',
                'Location Preferences: Preserves your selected State and City during property exploration.',
                'Shortlisted Favourites: Keeps your saved listings accessible across sessions.',
                'Security Markers: Detects abuse, prevents spam, and secures login attempts.',
              ],
            ),
            PolicySection(
              heading: '3. Third Parties & Privacy',
              content:
                  'We do not sell, rent, or share personal data with ad networks. Cloud infrastructure and payment gateways operate under strict security contracts.',
            ),
            PolicySection(
              heading: '4. Managing Your Preferences',
              content:
                  'You can reset your location selection at any time using "Change Location", clear local favourites, or log out from the Account tab. Logging out securely clears your local session tokens.',
            ),
          ],
        );

      case 'refunds':
      case 'refund-policy':
        return const LegalPolicyData(
          title: 'Refund & Cancellation Policy',
          effectiveDate: '28 August 2026',
          canonicalUrl: 'https://seedhaproperties.com/refund-policy',
          summary:
              'Seedha Properties is a 100% free, zero-brokerage property marketplace. This policy sets out the refund and cancellation rules for optional paid promotional services, handling of duplicate charges, and the clear separation between platform services and private landlord transactions.',
          sections: [
            PolicySection(
              heading: '1. Free Core Platform Services',
              content:
                  'All core features—searching homes, contacting owners directly, scheduling visits, standard property posting, and exploring home loan options—are 100% free with zero brokerage. There are no fees or platform commissions on these free features.',
            ),
            PolicySection(
              heading: '2. Optional Paid Promotion Boosts',
              content:
                  'Property owners may optionally purchase promotional boost packages (such as Fast-Track Promotion or Featured badges) for highlighted search placement. All charges include applicable GST and are clearly presented before payment.',
            ),
            PolicySection(
              heading: '3. Refund Eligibility for Paid Services',
              content: 'Refunds are granted under defined circumstances:',
              bullets: [
                'Duplicate Payments: Inadvertent double charges are refunded in full.',
                'Technical Non-Activation: If a paid boost fails to provision within 48 hours of reporting, a full refund is issued.',
                '48-Hour Cancellation Window: Owners cancelling a promotional boost within 48 hours of purchase (prior to verification or inquiry delivery) receive a pro-rated or full refund.',
              ],
            ),
            PolicySection(
              heading: '4. Non-Refundable Situations',
              content:
                  'Refunds are not granted once promotional boost packages have completed their active term, or where a listing was delisted for violating our Content Moderation Policy (such as fake listings or broker disguise).',
            ),
            PolicySection(
              heading: '5. User-to-User Deposits & Rent',
              content:
                  'Seedha Properties does not escrow, collect, or hold tenant security deposits or rent. All deposit refunds and lease covenants must be settled directly between landlord and tenant.',
            ),
            PolicySection(
              heading: '6. Processing Timeline',
              content:
                  'Approved refunds are verified within 2-3 business days and credited to the original payment method within 5-7 business days.',
            ),
          ],
        );

      case 'moderation':
      case 'moderation-policy':
        return const LegalPolicyData(
          title: 'Content Moderation Policy',
          effectiveDate: '28 August 2026',
          canonicalUrl: 'https://seedhaproperties.com/moderation-policy',
          summary:
              'Seedha Properties is dedicated to maintaining an authentic, zero-brokerage marketplace. This policy sets out the standards required for listings, photographs, and user communications, how our review process works, and how violations are enforced.',
          sections: [
            PolicySection(
              heading: '1. Owner & User Responsibility',
              content:
                  'Listing owners are solely responsible for ensuring the accuracy, legality, and authenticity of all submitted property details, pricing, and media.',
            ),
            PolicySection(
              heading: '2. Strictly Prohibited Content',
              content: 'The following violations result in immediate removal and possible account termination:',
              bullets: [
                'Fake, phantom, or unavailable property listings.',
                'False ownership claims or unauthorized postings without landlord consent.',
                'Brokers or agents posing as private direct owners.',
                'Deceptive pricing or hidden mandatory charges.',
                'Stock photos, stolen imagery, or manipulated media.',
                'Advance fee, viewing token, or cash transfer scams.',
                'Demanding sensitive personal data (passwords, OTPs, Aadhaar numbers).',
                'Harassment, discrimination, or abusive communications.',
              ],
            ),
            PolicySection(
              heading: '3. Moderation & Review Workflow',
              content:
                  'Listings are screened by automated pre-publish filters and reviewed by human administrators before gaining public visibility on the marketplace.',
            ),
            PolicySection(
              heading: '4. Reporting & Enforcement',
              content:
                  'Users can flag suspicious listings via the "Report" button on any property card or by emailing support@seedhaproperties.com. Violators face delisting, account bans, and law enforcement escalation for fraud.',
            ),
            PolicySection(
              heading: '5. Appeals',
              content:
                  'Owners may appeal moderation decisions within 14 calendar days by submitting proof of property ownership to support@seedhaproperties.com.',
            ),
          ],
        );

      case 'privacy':
      case 'privacy-policy':
        return const LegalPolicyData(
          title: 'Privacy Policy',
          effectiveDate: '28 August 2026',
          canonicalUrl: 'https://seedhaproperties.com/privacy-policy',
          summary:
              'Seedha Properties collects and protects personal data in strict compliance with the Digital Personal Data Protection Act, 2023. We do not sell or trade user data.',
          sections: [
            PolicySection(
              heading: '1. What We Collect',
              content:
                  'We collect only what is necessary to connect you with property owners: account email, phone number, saved favourites, and visit schedules.',
            ),
            PolicySection(
              heading: '2. How Data Is Used',
              content:
                  'Your contact details are shared only with property owners you choose to contact or schedule site visits with.',
            ),
            PolicySection(
              heading: '3. Data Protection & Security',
              content:
                  'All communications are encrypted in transit via HTTPS and protected at rest with Row Level Security in our cloud database.',
            ),
          ],
        );

      case 'terms':
      case 'terms-of-service':
      default:
        return const LegalPolicyData(
          title: 'Terms of Service',
          effectiveDate: '28 August 2026',
          canonicalUrl: 'https://seedhaproperties.com/terms-of-service',
          summary:
              'Terms and conditions governing the use of Seedha Properties, our direct-owner proptech platform, zero-brokerage marketplace, and user responsibilities.',
          sections: [
            PolicySection(
              heading: '1. Technology Intermediary Platform',
              content:
                  'Seedha Properties is an online technology intermediary connecting authentic owners with tenants and buyers. We are not brokers or party to private transactions.',
            ),
            PolicySection(
              heading: '2. Zero Brokerage Guarantee',
              content:
                  'We do not charge brokerage commissions on tenancies or sales arranged through our platform.',
            ),
            PolicySection(
              heading: '3. User Due Diligence',
              content:
                  'Users must physically inspect properties and verify title deeds before transferring monies or executing agreements.',
            ),
          ],
        );
    }
  }

  Future<void> _launchCanonicalUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final policy = _getPolicyData();

    return Scaffold(
      appBar: AppBar(
        title: Text(
          policy.title,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.open_in_browser_outlined),
            tooltip: 'View on Web',
            onPressed: () => _launchCanonicalUrl(policy.canonicalUrl),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0F766E).withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFF0F766E).withValues(alpha: 0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.verified_user_outlined, color: Color(0xFF0F766E), size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Effective: ${policy.effectiveDate}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF0F766E),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    policy.summary,
                    style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary, height: 1.4),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Policy Sections
            ...policy.sections.map(
              (section) => Padding(
                padding: const EdgeInsets.only(bottom: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      section.heading,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      section.content,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppTheme.textSecondary,
                        height: 1.45,
                      ),
                    ),
                    if (section.bullets != null && section.bullets!.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      ...section.bullets!.map(
                        (bullet) => Padding(
                          padding: const EdgeInsets.only(left: 8, bottom: 6),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('• ', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F766E))),
                              Expanded(
                                child: Text(
                                  bullet,
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    color: AppTheme.textSecondary,
                                    height: 1.4,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            const Divider(height: 32),

            // Support Contact Card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Questions or Legal Inquiries?',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Write to support@seedhaproperties.com. Our compliance team responds within standard business turnaround.',
                    style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.open_in_new, size: 16),
                      label: const Text('Open Official Web Policy', style: TextStyle(fontSize: 13)),
                      onPressed: () => _launchCanonicalUrl(policy.canonicalUrl),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
