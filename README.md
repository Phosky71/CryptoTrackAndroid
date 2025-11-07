# 📱 CryptoTrackAndroid

Android mobile application wrapper for [WalletSimulator](https://github.com/Phosky71/WalletSimulator), providing native Android access to the web-based cryptocurrency wallet and portfolio manager.

## 📝 Overview

CryptoTrackAndroid is a Flutter-based mobile application that integrates the WalletSimulator web application into a native Android app using WebView technology. This allows users to access all WalletSimulator features directly from their Android devices with a native app experience.

## ✨ Key Features

- 📲 **Native Android Experience**: Full-screen WebView integration with native Android UI elements
- 🌐 **Web App Integration**: Direct access to WalletSimulator deployed on Render
- ⚡ **JavaScript Enabled**: Full support for interactive web features
- 🎥 **Media Support**: Media playback configuration without user gesture requirements
- 🐛 **Debug Mode**: Enabled for Android development and testing
- 🔄 **Navigation Control**: Custom navigation delegation for web requests

## 🛠️ Technologies Used

- **Flutter**: Cross-platform framework for mobile development
- **Dart**: Programming language for Flutter applications
- **webview_flutter**: Official Flutter plugin for WebView integration
- **webview_flutter_android**: Android-specific WebView implementation
- **Android SDK**: Native Android development tools

## 📦 Installation

### Prerequisites

- Flutter SDK (latest stable version)
- Android Studio or VS Code with Flutter extensions
- Android SDK (API level 19 or higher)
- Java Development Kit (JDK) 11 or higher

### Setup

1. Clone the repository:
```bash
git clone https://github.com/Phosky71/CryptoTrackAndroid.git
cd CryptoTrackAndroid
```

2. Install Flutter dependencies:
```bash
flutter pub get
```

3. Connect an Android device or start an emulator

4. Run the application:
```bash
flutter run
```

## 🏗️ Project Structure

```
CryptoTrackAndroid/
├── android/          # Android-specific configuration
├── assets/
│   └── web/         # Web assets for offline support
├── ios/             # iOS configuration (not currently implemented)
├── lib/
│   └── main.dart    # Main application entry point
├── linux/           # Linux configuration
├── macos/           # macOS configuration
├── test/            # Test files
├── web/             # Web configuration
├── windows/         # Windows configuration
├── pubspec.yaml     # Flutter dependencies
└── README.md        # Project documentation
```

## 🔧 Configuration

### WebView Settings

The app is configured with the following WebView settings in `main.dart`:

- **JavaScript**: Enabled for full web app functionality
- **Debug Mode**: Enabled for Android platform
- **Media Playback**: Configured to require user gesture = false
- **Navigation Delegation**: Allows all navigation requests

### Backend Integration

The app loads the WalletSimulator web application from:
```
https://walletsimulator.onrender.com
```

This connects to the deployed backend, providing access to:
- User authentication and registration
- Cryptocurrency portfolio management
- Real-time crypto price tracking (CoinRanking API)
- Transaction history
- P2P transfers between users
- Buy/Sell cryptocurrency operations

## 📱 Features Inherited from WalletSimulator

Through the WebView integration, users have access to:

- ✅ **User Management**: Registration and login system
- ✅ **Portfolio Tracking**: View and manage cryptocurrency holdings
- ✅ **Real-time Prices**: Live cryptocurrency market data
- ✅ **Transactions**: Complete transaction history
- ✅ **P2P Transfers**: Send crypto to other registered users
- ✅ **Buy/Sell Operations**: Exchange functionality
- ✅ **Multi-currency Support**: Bitcoin, Ethereum, and more

## 🚀 Building for Production

### Android APK

```bash
flutter build apk --release
```

### Android App Bundle (for Google Play)

```bash
flutter build appbundle --release
```

The built files will be available in:
- APK: `build/app/outputs/flutter-apk/app-release.apk`
- App Bundle: `build/app/outputs/bundle/release/app-release.aab`

## 🔐 Security Notes

- The app loads content from a trusted HTTPS source
- All authentication and data management is handled by the WalletSimulator backend
- WebView security features are enabled by default
- Debug mode should be disabled for production builds

## 🔮 Future Improvements

- 🍎 iOS version implementation
- 📴 Offline mode with cached data
- 🔔 Push notifications for price alerts and transactions
- 📊 Native charts and data visualization
- 🌙 Dark mode support
- 🔐 Biometric authentication
- 📱 Deep linking support
- 🌍 Multi-language support

## 👤 Author

**Phosky71**
- GitHub: [@Phosky71](https://github.com/Phosky71)
- Project: [WalletSimulator](https://github.com/Phosky71/WalletSimulator)

## 📄 License

This project is part of the WalletSimulator ecosystem.

---

*Built with Flutter 💙 for Android 🤖*
