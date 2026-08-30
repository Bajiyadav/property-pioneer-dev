import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:seedha_properties_mobile/config/theme.dart';
import 'package:seedha_properties_mobile/providers/app_providers.dart';
import 'package:seedha_properties_mobile/features/properties/presentation/property_card_widget.dart';
import 'package:seedha_properties_mobile/shared/widgets/seedha_state_view.dart';
import 'package:seedha_properties_mobile/utils/error_handler.dart';

class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final favPropsAsync = ref.watch(favoritePropertiesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Saved Properties', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: favPropsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor)),
        error: (err, stack) => SeedhaStateView(
          type: SeedhaErrorHandler.getStateType(err),
          title: SeedhaErrorHandler.getFriendlyMessage(err),
          primaryAction: StateActionConfig(
            label: 'Retry',
            icon: Icons.refresh,
            onPressed: () => ref.refresh(favoritePropertiesProvider),
          ),
        ),
        data: (properties) {
          if (properties.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F766E).withValues(alpha: 0.08),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.favorite_border, size: 48, color: Color(0xFF0F766E)),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'No Saved Properties Yet',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Tap the heart icon on any property to save it here for quick access.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.4),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () => context.go('/'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0F766E),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Explore Properties', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 12),
            itemCount: properties.length,
            itemBuilder: (context, index) {
              final prop = properties[index];
              return PropertyCardWidget(
                property: prop,
                isFavorite: true,
                onTap: () => context.push('/properties/${prop.id}'),
                onToggleFavorite: () {
                  ref.read(favoritesProvider.notifier).toggleFavorite(prop.id);
                },
              );
            },
          );
        },
      ),
    );
  }
}
