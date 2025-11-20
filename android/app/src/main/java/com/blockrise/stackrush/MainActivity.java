package com.blockrise.stackrush;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.blockrise.stackrush.ads.NativeAdPlugin;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    @SuppressWarnings("deprecation")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        registerPlugin(NativeAdPlugin.class);

        // Enable edge-to-edge display
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // Make status bar transparent
        getWindow().setStatusBarColor(android.graphics.Color.TRANSPARENT);

        // Optional: Make navigation bar transparent too
        getWindow().setNavigationBarColor(android.graphics.Color.TRANSPARENT);
    }
}
