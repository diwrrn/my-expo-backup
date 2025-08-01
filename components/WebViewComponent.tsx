import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, RefreshCw, ExternalLink, Shield } from 'lucide-react-native';

interface WebViewComponentProps {
  url: string;
  title?: string;
  onClose?: () => void;
  showControls?: boolean;
}

export function WebViewComponent({ 
  url, 
  title = 'Web View', 
  onClose, 
  showControls = true 
}: WebViewComponentProps) {
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [webViewRef, setWebViewRef] = useState<WebView | null>(null);

  const handleLoadStart = () => {
    setLoading(true);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    Alert.alert(
      'Error Loading Page',
      `Failed to load: ${nativeEvent.description}`,
      [{ text: 'OK' }]
    );
  };

  const goBack = () => {
    if (webViewRef && canGoBack) {
      webViewRef.goBack();
    }
  };

  const goForward = () => {
    if (webViewRef && canGoForward) {
      webViewRef.goForward();
    }
  };

  const reload = () => {
    if (webViewRef) {
      webViewRef.reload();
    }
  };

  const openInBrowser = () => {
    // This would typically open in the system browser
    Alert.alert(
      'Open in Browser',
      `Would you like to open ${currentUrl} in your default browser?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open', onPress: () => console.log('Opening in browser:', currentUrl) }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {showControls && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {onClose && (
              <TouchableOpacity style={styles.headerButton} onPress={onClose}>
                <ArrowLeft size={20} color="#374151" />
              </TouchableOpacity>
            )}
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.url} numberOfLines={1}>
                {currentUrl}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={[styles.headerButton, !canGoBack && styles.headerButtonDisabled]} 
              onPress={goBack}
              disabled={!canGoBack}
            >
              <ArrowLeft size={18} color={canGoBack ? "#374151" : "#9CA3AF"} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.headerButton} onPress={reload}>
              <RefreshCw size={18} color="#374151" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.headerButton} onPress={openInBrowser}>
              <ExternalLink size={18} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBar}>
            <View style={styles.loadingProgress} />
          </View>
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={(ref) => setWebViewRef(ref)}
        source={{ uri: url }}
        style={styles.webview}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleError}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsBackForwardNavigationGestures={true}
        renderLoading={() => (
          <View style={styles.loadingScreen}>
            <RefreshCw size={32} color="#22C55E" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
      />

      {/* Security Indicator */}
      {showControls && (
        <View style={styles.footer}>
          <View style={styles.securityIndicator}>
            <Shield size={14} color={currentUrl.startsWith('https://') ? '#22C55E' : '#F59E0B'} />
            <Text style={styles.securityText}>
              {currentUrl.startsWith('https://') ? 'Secure Connection' : 'Not Secure'}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  url: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  loadingContainer: {
    height: 3,
    backgroundColor: '#F3F4F6',
  },
  loadingBar: {
    height: '100%',
    backgroundColor: '#E5E7EB',
    position: 'relative',
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: '#22C55E',
    width: '30%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  webview: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  securityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 6,
  },
});