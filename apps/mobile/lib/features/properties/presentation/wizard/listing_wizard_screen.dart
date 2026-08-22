import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'steps/step1_location.dart';
import 'steps/step2_details.dart';
import 'steps/step3_pricing.dart';
import 'steps/step4_amenities.dart';
import 'steps/step5_photos.dart';
import 'steps/step6_review.dart';

class ListingWizardScreen extends ConsumerStatefulWidget {
  const ListingWizardScreen({super.key});

  @override
  ConsumerState<ListingWizardScreen> createState() => _ListingWizardScreenState();
}

class _ListingWizardScreenState extends ConsumerState<ListingWizardScreen> {
  final PageController _pageController = PageController();
  int _currentStep = 0;
  final int _totalSteps = 6;

  void _nextStep() {
    if (_currentStep < _totalSteps - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('List Your Property'),
        leading: _currentStep > 0
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: _previousStep,
              )
            : const BackButton(),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4.0),
          child: LinearProgressIndicator(
            value: (_currentStep + 1) / _totalSteps,
            backgroundColor: Colors.grey[300],
            valueColor: AlwaysStoppedAnimation<Color>(
                Theme.of(context).colorScheme.primary),
          ),
        ),
      ),
      body: PageView(
        controller: _pageController,
        physics: const NeverScrollableScrollPhysics(), // Disable swipe to force validation via buttons
        onPageChanged: (index) {
          setState(() {
            _currentStep = index;
          });
        },
        children: [
          Step1Location(onNext: _nextStep),
          Step2Details(onNext: _nextStep, onBack: _previousStep),
          Step3Pricing(onNext: _nextStep, onBack: _previousStep),
          Step4Amenities(onNext: _nextStep, onBack: _previousStep),
          Step5Photos(onNext: _nextStep, onBack: _previousStep),
          Step6Review(onBack: _previousStep),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }
}
