package com.mezzo.music;

import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MediaSession")
public class MediaSessionPlugin extends Plugin {
    private static MediaSessionPlugin instance;

    @Override
    public void load() {
        super.load();
        instance = this;
    }

    public static void dispatchMediaAction(String action, double position) {
        if (instance != null) {
            JSObject ret = new JSObject();
            ret.put("action", action);
            if (position > 0) {
                ret.put("position", position);
            }
            instance.notifyListeners("mediaAction", ret);
        }
    }

    @PluginMethod
    public void updateState(PluginCall call) {
        Context context = getContext();
        if (context == null) {
            call.reject("Context is null");
            return;
        }

        String title = call.getString("title", "Mezzo Music");
        String artist = call.getString("artist", "Unknown Artist");
        String album = call.getString("album", "Mezzo");
        String artwork = call.getString("artwork", "");
        boolean isPlaying = Boolean.TRUE.equals(call.getBoolean("isPlaying", false));
        double duration = call.getDouble("duration", 0.0);
        double position = call.getDouble("position", 0.0);

        Intent intent = new Intent(context, MediaNotificationService.class);
        intent.setAction(MediaNotificationService.ACTION_UPDATE);
        intent.putExtra("title", title);
        intent.putExtra("artist", artist);
        intent.putExtra("album", album);
        intent.putExtra("artworkUrl", artwork);
        intent.putExtra("isPlaying", isPlaying);
        intent.putExtra("duration", duration);
        intent.putExtra("position", position);

        try {
            if (isPlaying) {
                ContextCompat.startForegroundService(context, intent);
            } else {
                context.startService(intent);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to start MediaNotificationService: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Context context = getContext();
        if (context != null) {
            Intent intent = new Intent(context, MediaNotificationService.class);
            intent.setAction(MediaNotificationService.ACTION_STOP);
            try {
                context.startService(intent);
            } catch (Exception ignored) {}
        }
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        instance = null;
        super.handleOnDestroy();
    }
}
