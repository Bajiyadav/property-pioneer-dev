import 'package:flutter/material.dart';

enum SeedhaStateType {
  empty,
  loading,
  noInternet,
  slowNetwork,
  noSearchResults,
  permissionDenied,
  sessionExpired,
  serverError,
  partialFailure,
  success,
  paymentPending,
  paymentSuccess,
  paymentFailed,
  emailVerificationSent,
}

class StateActionConfig {
  final String label;
  final VoidCallback onPressed;
  final IconData? icon;
  final bool isPrimary;

  const StateActionConfig({
    required this.label,
    required this.onPressed,
    this.icon,
    this.isPrimary = true,
  });
}

class SeedhaStateView extends StatelessWidget {
  final SeedhaStateType type;
  final String? title;
  final String? description;
  final bool compact;
  final bool inline;
  final StateActionConfig? primaryAction;
  final StateActionConfig? secondaryAction;
  final List<String>? appliedFilters;
  final VoidCallback? onClearFilters;
  final String? referenceCode;
  final Widget? customContent;

  const SeedhaStateView({
    super.key,
    required this.type,
    this.title,
    this.description,
    this.compact = false,
    this.inline = false,
    this.primaryAction,
    this.secondaryAction,
    this.appliedFilters,
    this.onClearFilters,
    this.referenceCode,
    this.customContent,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final config = _getStateConfig(type, theme);

    if (inline) {
      return Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: config.backgroundColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: config.borderColor),
        ),
        child: Row(
          children: [
            Icon(config.icon, size: 20, color: config.iconColor),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title ?? config.title,
                    style: theme.textTheme.labelLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: config.textColor,
                    ),
                  ),
                  if (description != null || config.description.isNotEmpty)
                    Text(
                      description ?? config.description,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                    ),
                ],
              ),
            ),
            if (primaryAction != null) ...[
              const SizedBox(width: 8),
              TextButton(
                onPressed: primaryAction!.onPressed,
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  primaryAction!.label,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: theme.primaryColor,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ],
        ),
      );
    }

    return Center(
      child: SingleChildScrollView(
        padding: EdgeInsets.all(compact ? 16 : 24),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 480),
          padding: EdgeInsets.all(compact ? 20 : 28),
          decoration: BoxDecoration(
            color: theme.cardColor,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.grey.shade200),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 14,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Icon Badge
              Container(
                width: compact ? 48 : 64,
                height: compact ? 48 : 64,
                decoration: BoxDecoration(
                  color: config.badgeBackgroundColor,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: type == SeedhaStateType.loading || type == SeedhaStateType.paymentPending
                    ? Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          color: config.iconColor,
                        ),
                      )
                    : Icon(
                        config.icon,
                        size: compact ? 26 : 34,
                        color: config.iconColor,
                      ),
              ),
              SizedBox(height: compact ? 14 : 20),

              // Title
              Text(
                title ?? config.title,
                textAlign: TextAlign.center,
                style: (compact ? theme.textTheme.titleMedium : theme.textTheme.titleLarge)?.copyWith(
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.2,
                ),
              ),
              const SizedBox(height: 8),

              // Description
              Text(
                description ?? config.description,
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: Colors.grey.shade600,
                  height: 1.4,
                ),
              ),

              // Applied Filters Tag List
              if (appliedFilters != null && appliedFilters!.isNotEmpty) ...[
                const SizedBox(height: 16),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  alignment: WrapAlignment.center,
                  children: [
                    ...appliedFilters!.map(
                      (filter) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          filter,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: Colors.grey.shade800,
                          ),
                        ),
                      ),
                    ),
                    if (onClearFilters != null)
                      GestureDetector(
                        onTap: onClearFilters,
                        child: const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                          child: Text(
                            "Clear all",
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF0F766E),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ],

              // Diagnostic Reference Code
              if (referenceCode != null) ...[
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    "Ref: $referenceCode",
                    style: TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 11,
                      color: Colors.grey.shade700,
                    ),
                  ),
                ),
              ],

              if (customContent != null) ...[
                const SizedBox(height: 16),
                customContent!,
              ],

              // Actions
              if (primaryAction != null || secondaryAction != null) ...[
                SizedBox(height: compact ? 20 : 26),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (secondaryAction != null) ...[
                      OutlinedButton.icon(
                        onPressed: secondaryAction!.onPressed,
                        icon: secondaryAction!.icon != null
                            ? Icon(secondaryAction!.icon, size: 16)
                            : const SizedBox.shrink(),
                        label: Text(secondaryAction!.label),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                    ],
                    if (primaryAction != null)
                      ElevatedButton.icon(
                        onPressed: primaryAction!.onPressed,
                        icon: primaryAction!.icon != null
                            ? Icon(primaryAction!.icon, size: 16)
                            : const SizedBox.shrink(),
                        label: Text(primaryAction!.label),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0F766E),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  _StateDisplayConfig _getStateConfig(SeedhaStateType type, ThemeData theme) {
    switch (type) {
      case SeedhaStateType.empty:
        return const _StateDisplayConfig(
          icon: Icons.inbox_outlined,
          title: "No items to display",
          description: "When items are added, they will appear here.",
          iconColor: Colors.grey,
          badgeBackgroundColor: Color(0xFFF3F4F6),
          backgroundColor: Color(0xFFF9FAFB),
          borderColor: Color(0xFFE5E7EB),
          textColor: Colors.black87,
        );
      case SeedhaStateType.loading:
        return const _StateDisplayConfig(
          icon: Icons.hourglass_top,
          title: "Loading...",
          description: "Fetching the latest details for you.",
          iconColor: Color(0xFF0F766E),
          badgeBackgroundColor: Color(0xFFCCFBF1),
          backgroundColor: Color(0xFFF0FDFA),
          borderColor: Color(0xFF99F6E4),
          textColor: Color(0xFF0F766E),
        );
      case SeedhaStateType.noInternet:
        return const _StateDisplayConfig(
          icon: Icons.wifi_off_rounded,
          title: "You're offline",
          description: "Check your internet connection and tap retry.",
          iconColor: Color(0xFFD97706),
          badgeBackgroundColor: Color(0xFFFEF3C7),
          backgroundColor: Color(0xFFFFFBEB),
          borderColor: Color(0xFFFDE68A),
          textColor: Color(0xFF92400E),
        );
      case SeedhaStateType.slowNetwork:
        return const _StateDisplayConfig(
          icon: Icons.access_time_rounded,
          title: "Taking longer than usual...",
          description: "Your network connection seems slow. Still retrieving data.",
          iconColor: Color(0xFF0284C7),
          badgeBackgroundColor: Color(0xFFE0F2FE),
          backgroundColor: Color(0xFFF0F9FF),
          borderColor: Color(0xFFBAE6FD),
          textColor: Color(0xFF075985),
        );
      case SeedhaStateType.noSearchResults:
        return const _StateDisplayConfig(
          icon: Icons.search_off_rounded,
          title: "No properties found",
          description: "We couldn't find homes matching your criteria. Try adjusting your search filters.",
          iconColor: Colors.grey,
          badgeBackgroundColor: Color(0xFFF3F4F6),
          backgroundColor: Color(0xFFF9FAFB),
          borderColor: Color(0xFFE5E7EB),
          textColor: Colors.black87,
        );
      case SeedhaStateType.permissionDenied:
        return const _StateDisplayConfig(
          icon: Icons.gpp_bad_outlined,
          title: "Access restricted",
          description: "You don't have permission to view or manage this resource.",
          iconColor: Color(0xFFE11D48),
          badgeBackgroundColor: Color(0xFFFFE4E6),
          backgroundColor: Color(0xFFFFF1F2),
          borderColor: Color(0xFFFECDD3),
          textColor: Color(0xFF9F1239),
        );
      case SeedhaStateType.sessionExpired:
        return const _StateDisplayConfig(
          icon: Icons.lock_outline_rounded,
          title: "Session expired",
          description: "Your session has ended. Please sign in again to continue.",
          iconColor: Color(0xFF4F46E5),
          badgeBackgroundColor: Color(0xFFE0E7FF),
          backgroundColor: Color(0xFFEEF2FF),
          borderColor: Color(0xFFC7D2FE),
          textColor: Color(0xFF3730A3),
        );
      case SeedhaStateType.serverError:
        return const _StateDisplayConfig(
          icon: Icons.warning_amber_rounded,
          title: "Something went wrong",
          description: "We couldn't complete your request right now. Please try again.",
          iconColor: Color(0xFFE11D48),
          badgeBackgroundColor: Color(0xFFFFE4E6),
          backgroundColor: Color(0xFFFFF1F2),
          borderColor: Color(0xFFFECDD3),
          textColor: Color(0xFF9F1239),
        );
      case SeedhaStateType.partialFailure:
        return const _StateDisplayConfig(
          icon: Icons.error_outline_rounded,
          title: "Couldn't load this section",
          description: "Other parts of the screen remain available while we retry.",
          iconColor: Color(0xFFD97706),
          badgeBackgroundColor: Color(0xFFFEF3C7),
          backgroundColor: Color(0xFFFFFBEB),
          borderColor: Color(0xFFFDE68A),
          textColor: Color(0xFF92400E),
        );
      case SeedhaStateType.success:
        return const _StateDisplayConfig(
          icon: Icons.check_circle_outline_rounded,
          title: "Action completed",
          description: "Your request was processed successfully.",
          iconColor: Color(0xFF059669),
          badgeBackgroundColor: Color(0xFFD1FAE5),
          backgroundColor: Color(0xFFECFDF5),
          borderColor: Color(0xFFA7F3D0),
          textColor: Color(0xFF065F46),
        );
      case SeedhaStateType.paymentPending:
        return const _StateDisplayConfig(
          icon: Icons.payment_rounded,
          title: "Payment processing...",
          description: "Waiting for payment gateway confirmation. Please don't close the app.",
          iconColor: Color(0xFF0F766E),
          badgeBackgroundColor: Color(0xFFCCFBF1),
          backgroundColor: Color(0xFFF0FDFA),
          borderColor: Color(0xFF99F6E4),
          textColor: Color(0xFF0F766E),
        );
      case SeedhaStateType.paymentSuccess:
        return const _StateDisplayConfig(
          icon: Icons.verified_outlined,
          title: "Payment successful ✓",
          description: "Your contact unlock pass has been activated.",
          iconColor: Color(0xFF059669),
          badgeBackgroundColor: Color(0xFFD1FAE5),
          backgroundColor: Color(0xFFECFDF5),
          borderColor: Color(0xFFA7F3D0),
          textColor: Color(0xFF065F46),
        );
      case SeedhaStateType.paymentFailed:
        return const _StateDisplayConfig(
          icon: Icons.cancel_outlined,
          title: "Payment was not completed",
          description: "Your account was not charged. You can retry anytime.",
          iconColor: Color(0xFFE11D48),
          badgeBackgroundColor: Color(0xFFFFE4E6),
          backgroundColor: Color(0xFFFFF1F2),
          borderColor: Color(0xFFFECDD3),
          textColor: Color(0xFF9F1239),
        );
      case SeedhaStateType.emailVerificationSent:
        return const _StateDisplayConfig(
          icon: Icons.mark_email_read_outlined,
          title: "Verification email sent",
          description: "Please check your inbox and tap the link to verify your account.",
          iconColor: Color(0xFF0284C7),
          badgeBackgroundColor: Color(0xFFE0F2FE),
          backgroundColor: Color(0xFFF0F9FF),
          borderColor: Color(0xFFBAE6FD),
          textColor: Color(0xFF075985),
        );
    }
  }
}

class _StateDisplayConfig {
  final IconData icon;
  final String title;
  final String description;
  final Color iconColor;
  final Color badgeBackgroundColor;
  final Color backgroundColor;
  final Color borderColor;
  final Color textColor;

  const _StateDisplayConfig({
    required this.icon,
    required this.title,
    required this.description,
    required this.iconColor,
    required this.badgeBackgroundColor,
    required this.backgroundColor,
    required this.borderColor,
    required this.textColor,
  });
}
