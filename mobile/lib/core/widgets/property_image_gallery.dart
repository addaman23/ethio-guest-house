import 'package:flutter/material.dart';

class PropertyImageGallery extends StatefulWidget {
  const PropertyImageGallery({
    super.key,
    required this.imageUrls,
    this.height = 220,
    this.title,
  });

  final List<String> imageUrls;
  final double height;
  final String? title;

  static Future<void> openFullScreen(
    BuildContext context, {
    required List<String> imageUrls,
    int initialIndex = 0,
    String? title,
  }) {
    if (imageUrls.isEmpty) return Future.value();
    return showDialog<void>(
      context: context,
      barrierColor: Colors.black87,
      builder: (ctx) => _FullScreenGallery(
        imageUrls: imageUrls,
        initialIndex: initialIndex,
        title: title,
      ),
    );
  }

  @override
  State<PropertyImageGallery> createState() => _PropertyImageGalleryState();
}

class _PropertyImageGalleryState extends State<PropertyImageGallery> {
  int _index = 0;

  void _openFullScreen(int index) {
    PropertyImageGallery.openFullScreen(
      context,
      imageUrls: widget.imageUrls,
      initialIndex: index,
      title: widget.title,
    );
  }

  @override
  Widget build(BuildContext context) {
    final urls = widget.imageUrls;
    if (urls.isEmpty) {
      return SizedBox(
        height: widget.height,
        child: const ColoredBox(
          color: Color(0xFFE8EDE9),
          child: Center(
            child: Icon(Icons.photo_library_outlined, size: 48, color: Colors.black38),
          ),
        ),
      );
    }

    return Column(
      children: [
        SizedBox(
          height: widget.height,
          child: Stack(
            alignment: Alignment.bottomCenter,
            children: [
              PageView.builder(
                itemCount: urls.length,
                onPageChanged: (i) => setState(() => _index = i),
                itemBuilder: (_, i) => GestureDetector(
                  onTap: () => _openFullScreen(i),
                  child: _GalleryImage(url: urls[i]),
                ),
              ),
              if (urls.length > 1)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'Tap to enlarge · ${_index + 1}/${urls.length}',
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ),
                ),
            ],
          ),
        ),
        if (urls.length > 1) ...[
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              urls.length,
              (i) => Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.symmetric(horizontal: 3),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: i == _index ? const Color(0xFF0D6E4F) : Colors.black26,
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class PropertyThumbnail extends StatelessWidget {
  const PropertyThumbnail({
    super.key,
    required this.imageUrl,
    this.size = 72,
    this.imageUrls,
    this.title,
  });

  final String? imageUrl;
  final double size;
  final List<String>? imageUrls;
  final String? title;

  @override
  Widget build(BuildContext context) {
    if (imageUrl == null || imageUrl!.isEmpty) {
      return Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: const Color(0xFFE8EDE9),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Icon(Icons.home_work_outlined, color: Colors.black38),
      );
    }
    final urls = imageUrls ?? [imageUrl!];
    return GestureDetector(
      onTap: () => PropertyImageGallery.openFullScreen(
        context,
        imageUrls: urls,
        title: title,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.network(
          imageUrl!,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => Container(
            width: size,
            height: size,
            color: const Color(0xFFE8EDE9),
            child: const Icon(Icons.broken_image_outlined),
          ),
        ),
      ),
    );
  }
}

class _GalleryImage extends StatelessWidget {
  const _GalleryImage({required this.url});

  final String url;

  @override
  Widget build(BuildContext context) {
    return Image.network(
      url,
      fit: BoxFit.cover,
      width: double.infinity,
      loadingBuilder: (_, child, progress) {
        if (progress == null) return child;
        return const ColoredBox(
          color: Color(0xFFE8EDE9),
          child: Center(child: CircularProgressIndicator()),
        );
      },
      errorBuilder: (_, __, ___) => const ColoredBox(
        color: Color(0xFFE8EDE9),
        child: Center(child: Icon(Icons.broken_image_outlined, size: 48)),
      ),
    );
  }
}

class _FullScreenGallery extends StatefulWidget {
  const _FullScreenGallery({
    required this.imageUrls,
    required this.initialIndex,
    this.title,
  });

  final List<String> imageUrls;
  final int initialIndex;
  final String? title;

  @override
  State<_FullScreenGallery> createState() => _FullScreenGalleryState();
}

class _FullScreenGalleryState extends State<_FullScreenGallery> {
  late final PageController _controller;
  late int _index;

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex;
    _controller = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog.fullscreen(
      backgroundColor: Colors.black,
      child: SafeArea(
        child: Stack(
          children: [
            PageView.builder(
              controller: _controller,
              itemCount: widget.imageUrls.length,
              onPageChanged: (i) => setState(() => _index = i),
              itemBuilder: (_, i) => InteractiveViewer(
                minScale: 0.8,
                maxScale: 4,
                child: Center(
                  child: Image.network(
                    widget.imageUrls[i],
                    fit: BoxFit.contain,
                    loadingBuilder: (_, child, progress) {
                      if (progress == null) return child;
                      return const Center(child: CircularProgressIndicator(color: Colors.white));
                    },
                    errorBuilder: (_, __, ___) => const Icon(
                      Icons.broken_image_outlined,
                      color: Colors.white54,
                      size: 64,
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              top: 8,
              right: 8,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 28),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
            if (widget.title != null || widget.imageUrls.length > 1)
              Positioned(
                left: 16,
                right: 16,
                bottom: 16,
                child: Text(
                  [
                    if (widget.title != null) widget.title!,
                    if (widget.imageUrls.length > 1)
                      'Photo ${_index + 1} of ${widget.imageUrls.length}',
                  ].join(' · '),
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white70),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
