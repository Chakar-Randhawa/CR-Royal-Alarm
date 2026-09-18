package com.crroyal.alarm;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Custom local plugin (not an npm package) must be registered manually.
        registerPlugin(NativeSettingsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
