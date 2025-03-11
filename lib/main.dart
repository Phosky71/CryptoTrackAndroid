import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatefulWidget {
  @override
  _MyAppState createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();

    // Set the platform-specific WebView implementation for Android
    WebViewPlatform.instance = AndroidWebViewPlatform();

    // Create platform-specific WebViewController creation params
    late final PlatformWebViewControllerCreationParams params;
    params = const PlatformWebViewControllerCreationParams();

    // Instantiate the WebViewController
    _controller = WebViewController.fromPlatformCreationParams(params)
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            // Update loading bar.
          },
          onPageStarted: (String url) {},
          onPageFinished: (String url) {},
          onHttpError: (HttpResponseError error) {},
          onWebResourceError: (WebResourceError error) {},
          onNavigationRequest: (NavigationRequest request) {
            return NavigationDecision.navigate;
          },
        ),
      );

    // Load the URL from Render
    _controller.loadRequest(Uri.parse('https://walletsimulator.onrender.com'));

    // Enable debugging and set media playback requires user gesture for Android
    if (_controller.platform is AndroidWebViewController) {
      AndroidWebViewController.enableDebugging(true);
      (_controller.platform as AndroidWebViewController)
          .setMediaPlaybackRequiresUserGesture(false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(
          title: Text('Wallet Simulator Web App'),
        ),
        body: WebViewWidget(controller: _controller),
      ),
    );
  }
}



// import 'package:flutter/material.dart';
// import 'package:webview_flutter/webview_flutter.dart';
// import 'package:webview_flutter_android/webview_flutter_android.dart';
//
// void main() {
//   runApp(MyApp());
// }
//
// class MyApp extends StatefulWidget {
//   @override
//   _MyAppState createState() => _MyAppState();
// }
//
// class _MyAppState extends State<MyApp> {
//   late final WebViewController _controller;
//
//   @override
//   void initState() {
//     super.initState();
//
//     // Set the platform-specific WebView implementation for Android
//     WebViewPlatform.instance = AndroidWebViewPlatform();
//
//     // Create platform-specific WebViewController creation params
//     late final PlatformWebViewControllerCreationParams params;
//     params = const PlatformWebViewControllerCreationParams();
//
//     // Instantiate the WebViewController
//     _controller = WebViewController.fromPlatformCreationParams(params)
//       ..setJavaScriptMode(JavaScriptMode.unrestricted)
//       ..setNavigationDelegate(
//         NavigationDelegate(
//           onProgress: (int progress) {
//             // Update loading bar.
//           },
//           onPageStarted: (String url) {},
//           onPageFinished: (String url) {},
//           onHttpError: (HttpResponseError error) {},
//           onWebResourceError: (WebResourceError error) {},
//           onNavigationRequest: (NavigationRequest request) {
//             return NavigationDecision.navigate;
//           },
//         ),
//       );
//
//     // Load the initial URL
//     _controller.loadRequest(Uri.parse('https://walletsimulator.onrender.com'));
//
//     // Enable debugging and set media playback requires user gesture for Android
//     if (_controller.platform is AndroidWebViewController) {
//       AndroidWebViewController.enableDebugging(true);
//       (_controller.platform as AndroidWebViewController)
//           .setMediaPlaybackRequiresUserGesture(false);
//     }
//   }
//
//   @override
//   Widget build(BuildContext context) {
//     return MaterialApp(
//       home: Scaffold(
//         appBar: AppBar(
//           title: Text('WebView Example'),
//         ),
//         body: WebViewWidget(controller: _controller),
//       ),
//     );
//   }
// }
