import 'package:flutter/material.dart';
import 'config/theme.dart';
import 'features/home/presentation/home_screen.dart';
import 'services/supabase_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await SupabaseService.initialize();
  } catch (e) {
    // Offline resilience
  }
  runApp(const UrbanPropertiesMobileApp());
}

class UrbanPropertiesMobileApp extends StatelessWidget {
  const UrbanPropertiesMobileApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Urban Properties',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const HomeScreen(),
    );
  }
}
