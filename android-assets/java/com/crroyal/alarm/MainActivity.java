package com.crroyal.alarm;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Custom local plugin (not an npm package) must be registered manually.
        registerPlugin(NativeSettingsPlugin.class);
        super.onCreate(savedInstanceState);

        // True edge-to-edge: the WebView draws behind both the status bar
        // and the navigation bar (gesture pill or 3-button, doesn't
        // matter), and both bars are fully transparent with no automatic
        // contrast scrim. This is what makes the app's own theme color
        // reach every physical pixel with zero seam, on every device —
        // instead of relying on a native bar color that has to be kept in
        // sync with the current theme.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setStatusBarContrastEnforced(false);
            getWindow().setNavigationBarContrastEnforced(false);
        }
    }
}
