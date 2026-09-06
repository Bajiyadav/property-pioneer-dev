import java.io.FileInputStream
import java.util.Properties

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    namespace = "com.seedhaproperties.seedha_properties_mobile"
    compileSdk = flutter.compileSdkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    signingConfigs {
        create("release") {
            val keyAliasProp = keystoreProperties.getProperty("keyAlias") ?: System.getenv("ANDROID_KEY_ALIAS")
            val keyPasswordProp = keystoreProperties.getProperty("keyPassword") ?: System.getenv("ANDROID_KEY_PASSWORD")
            val storePasswordProp = keystoreProperties.getProperty("storePassword") ?: System.getenv("ANDROID_STORE_PASSWORD")
            val storeFilePathProp = keystoreProperties.getProperty("storeFile") ?: System.getenv("ANDROID_KEYSTORE_PATH")

            if (storeFilePathProp != null) {
                val resolvedFile = if (rootProject.file(storeFilePathProp).exists()) {
                    rootProject.file(storeFilePathProp)
                } else if (file(storeFilePathProp).exists()) {
                    file(storeFilePathProp)
                } else {
                    null
                }

                if (resolvedFile != null) {
                    keyAlias = keyAliasProp
                    keyPassword = keyPasswordProp
                    storeFile = resolvedFile
                    storePassword = storePasswordProp
                }
            }
        }
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.seedhaproperties.seedha_properties_mobile"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            val releaseSigning = signingConfigs.getByName("release")
            signingConfig = if (releaseSigning.storeFile != null && releaseSigning.storeFile!!.exists()) {
                releaseSigning
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
