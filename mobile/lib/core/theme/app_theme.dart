import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color forest = Color(0xFF0C2E24);
  static const Color forestDeep = Color(0xFF071A14);
  static const Color leaf = Color(0xFF1F6B52);
  static const Color ochre = Color(0xFFD4893A);
  static const Color mist = Color(0xFFE4EDE8);
  static const Color paper = Color(0xFFF3F7F4);
  static const Color ink = Color(0xFF12201B);
  static const Color muted = Color(0xFF4D635A);

  /// Alias kept for older call sites.
  static const Color primary = leaf;
  static const Color accent = ochre;

  static ThemeData get light {
    final display = GoogleFonts.syneTextTheme().apply(
      bodyColor: ink,
      displayColor: ink,
    );
    final body = GoogleFonts.manropeTextTheme().apply(
      bodyColor: ink,
      displayColor: ink,
    );

    final textTheme = body.copyWith(
      displayLarge: display.displayLarge?.copyWith(
        fontWeight: FontWeight.w800,
        letterSpacing: -1.2,
        height: 1.05,
      ),
      displayMedium: display.displayMedium?.copyWith(
        fontWeight: FontWeight.w800,
        letterSpacing: -1,
      ),
      displaySmall: display.displaySmall?.copyWith(
        fontWeight: FontWeight.w700,
        letterSpacing: -0.6,
      ),
      headlineLarge: display.headlineLarge?.copyWith(
        fontWeight: FontWeight.w800,
        letterSpacing: -0.8,
      ),
      headlineMedium: display.headlineMedium?.copyWith(
        fontWeight: FontWeight.w700,
        letterSpacing: -0.5,
      ),
      headlineSmall: display.headlineSmall?.copyWith(
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
      ),
      titleLarge: display.titleLarge?.copyWith(
        fontWeight: FontWeight.w700,
        letterSpacing: -0.2,
      ),
      titleMedium: body.titleMedium?.copyWith(fontWeight: FontWeight.w700),
      titleSmall: body.titleSmall?.copyWith(fontWeight: FontWeight.w600),
      bodyLarge: body.bodyLarge?.copyWith(height: 1.45, fontSize: 16),
      bodyMedium: body.bodyMedium?.copyWith(height: 1.45, color: muted),
      bodySmall: body.bodySmall?.copyWith(height: 1.4, color: muted),
      labelLarge: body.labelLarge?.copyWith(fontWeight: FontWeight.w700),
    );

    final scheme = ColorScheme.fromSeed(
      seedColor: leaf,
      primary: leaf,
      secondary: ochre,
      surface: Colors.white,
      brightness: Brightness.light,
    ).copyWith(
      onPrimary: Colors.white,
      onSecondary: forestDeep,
      onSurface: ink,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: paper,
      textTheme: textTheme,
      primaryTextTheme: textTheme,
      appBarTheme: AppBarTheme(
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: paper.withOpacity(0.94),
        foregroundColor: forest,
        titleTextStyle: GoogleFonts.syne(
          fontWeight: FontWeight.w800,
          fontSize: 20,
          letterSpacing: -0.4,
          color: forest,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: mist),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: leaf, width: 1.6),
        ),
        labelStyle: GoogleFonts.manrope(color: muted, fontWeight: FontWeight.w600),
        hintStyle: GoogleFonts.manrope(color: muted.withOpacity(0.7)),
      ),
      cardTheme: CardTheme(
        elevation: 0,
        color: Colors.white,
        margin: const EdgeInsets.only(bottom: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(color: forest.withOpacity(0.08)),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: leaf,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: GoogleFonts.manrope(fontWeight: FontWeight.w700, fontSize: 15),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: leaf,
          side: const BorderSide(color: leaf),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 13),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: GoogleFonts.manrope(fontWeight: FontWeight.w700, fontSize: 15),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: leaf,
          textStyle: GoogleFonts.manrope(fontWeight: FontWeight.w700),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: mist,
        selectedColor: leaf.withOpacity(0.18),
        labelStyle: GoogleFonts.manrope(fontWeight: FontWeight.w600, color: forest),
        side: BorderSide.none,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: forestDeep,
        contentTextStyle: GoogleFonts.manrope(color: Colors.white),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      dividerTheme: DividerThemeData(color: forest.withOpacity(0.08)),
      listTileTheme: ListTileThemeData(
        titleTextStyle: GoogleFonts.manrope(
          fontWeight: FontWeight.w700,
          fontSize: 16,
          color: ink,
        ),
        subtitleTextStyle: GoogleFonts.manrope(
          fontSize: 13.5,
          height: 1.4,
          color: muted,
        ),
      ),
    );
  }
}
