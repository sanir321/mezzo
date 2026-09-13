package com.mezzo.music;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;

import androidx.core.app.NotificationCompat;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MediaNotificationService extends Service {
    public static final String CHANNEL_ID = "mezzo_playback_channel";
    public static final int NOTIFICATION_ID = 2002;

    public static final String ACTION_PREV = "com.mezzo.music.ACTION_PREV";
    public static final String ACTION_PLAY = "com.mezzo.music.ACTION_PLAY";
    public static final String ACTION_PAUSE = "com.mezzo.music.ACTION_PAUSE";
    public static final String ACTION_NEXT = "com.mezzo.music.ACTION_NEXT";
    public static final String ACTION_UPDATE = "com.mezzo.music.ACTION_UPDATE";
    public static final String ACTION_STOP = "com.mezzo.music.ACTION_STOP";

    private MediaSessionCompat mediaSession;
    private NotificationManager notificationManager;
    private PowerManager.WakeLock wakeLock;
    private final ExecutorService imageExecutor = Executors.newSingleThreadExecutor();

    private String currentTitle = "Mezzo Music";
    private String currentArtist = "Streaming";
    private String currentAlbum = "Mezzo";
    private String currentArtworkUrl = "";
    private boolean isCurrentlyPlaying = false;
    private Bitmap cachedArtBitmap = null;

    @Override
    public void onCreate() {
        super.onCreate();
        notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        createNotificationChannel();

        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Mezzo::MediaPlaybackWakeLock");
            wakeLock.setReferenceCounted(false);
        }

        mediaSession = new MediaSessionCompat(this, "MezzoMediaSession");
        mediaSession.setFlags(MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS | MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS);
        mediaSession.setCallback(new MediaSessionCompat.Callback() {
            @Override
            public void onPlay() {
                MediaSessionPlugin.dispatchMediaAction("play", 0);
            }

            @Override
            public void onPause() {
                MediaSessionPlugin.dispatchMediaAction("pause", 0);
            }

            @Override
            public void onSkipToNext() {
                MediaSessionPlugin.dispatchMediaAction("next", 0);
            }

            @Override
            public void onSkipToPrevious() {
                MediaSessionPlugin.dispatchMediaAction("previous", 0);
            }

            @Override
            public void onSeekTo(long pos) {
                MediaSessionPlugin.dispatchMediaAction("seek", pos / 1000.0);
            }

            @Override
            public void onStop() {
                MediaSessionPlugin.dispatchMediaAction("pause", 0);
                stopPlaybackService();
            }
        });

        mediaSession.setActive(true);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || intent.getAction() == null) {
            return START_NOT_STICKY;
        }

        String action = intent.getAction();
        switch (action) {
            case ACTION_PREV:
                MediaSessionPlugin.dispatchMediaAction("previous", 0);
                break;
            case ACTION_PLAY:
                MediaSessionPlugin.dispatchMediaAction("play", 0);
                break;
            case ACTION_PAUSE:
                MediaSessionPlugin.dispatchMediaAction("pause", 0);
                break;
            case ACTION_NEXT:
                MediaSessionPlugin.dispatchMediaAction("next", 0);
                break;
            case ACTION_STOP:
                stopPlaybackService();
                return START_NOT_STICKY;
            case ACTION_UPDATE:
                handleUpdateIntent(intent);
                break;
        }

        return START_STICKY;
    }

    private void handleUpdateIntent(Intent intent) {
        currentTitle = intent.getStringExtra("title") != null ? intent.getStringExtra("title") : "Mezzo Music";
        currentArtist = intent.getStringExtra("artist") != null ? intent.getStringExtra("artist") : "Unknown Artist";
        currentAlbum = intent.getStringExtra("album") != null ? intent.getStringExtra("album") : "Mezzo";
        String newArtworkUrl = intent.getStringExtra("artworkUrl") != null ? intent.getStringExtra("artworkUrl") : "";
        isCurrentlyPlaying = intent.getBooleanExtra("isPlaying", false);
        double duration = intent.getDoubleExtra("duration", 0);
        double position = intent.getDoubleExtra("position", 0);

        // Update MediaSession PlaybackState
        long actions = PlaybackStateCompat.ACTION_PLAY
                | PlaybackStateCompat.ACTION_PAUSE
                | PlaybackStateCompat.ACTION_PLAY_PAUSE
                | PlaybackStateCompat.ACTION_SKIP_TO_NEXT
                | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
                | PlaybackStateCompat.ACTION_SEEK_TO;

        int state = isCurrentlyPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED;
        PlaybackStateCompat.Builder stateBuilder = new PlaybackStateCompat.Builder()
                .setActions(actions)
                .setState(state, (long) (position * 1000), 1.0f);
        mediaSession.setPlaybackState(stateBuilder.build());

        // Manage WakeLock to prevent audio interruption when phone screen is turned off
        if (isCurrentlyPlaying) {
            if (wakeLock != null && !wakeLock.isHeld()) {
                wakeLock.acquire(180 * 60 * 1000L /* 3 hours max */);
            }
        } else {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
        }

        // Check if artwork changed
        if (!newArtworkUrl.isEmpty() && !newArtworkUrl.equals(currentArtworkUrl)) {
            currentArtworkUrl = newArtworkUrl;
            imageExecutor.execute(() -> {
                Bitmap bmp = downloadBitmap(currentArtworkUrl);
                if (bmp != null) {
                    cachedArtBitmap = bmp;
                }
                updateNotificationAndMetadata((long) (duration * 1000));
            });
        } else {
            updateNotificationAndMetadata((long) (duration * 1000));
        }
    }

    private void updateNotificationAndMetadata(long durationMs) {
        // Update MediaMetadata
        MediaMetadataCompat.Builder metaBuilder = new MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, currentTitle)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)
                .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, currentAlbum)
                .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, durationMs);

        if (cachedArtBitmap != null) {
            metaBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, cachedArtBitmap);
            metaBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ART, cachedArtBitmap);
        }

        mediaSession.setMetadata(metaBuilder.build());

        Notification notification = buildNotification();

        try {
            if (isCurrentlyPlaying) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
                } else {
                    startForeground(NOTIFICATION_ID, notification);
                }
            } else {
                stopForeground(false);
                notificationManager.notify(NOTIFICATION_ID, notification);
            }
        } catch (Exception e) {
            // Fallback notify
            try {
                notificationManager.notify(NOTIFICATION_ID, notification);
            } catch (Exception ignored) {}
        }
    }

    private Notification buildNotification() {
        Intent launchIntent = new Intent(this, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(
                this, 0, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Intent prevIntent = new Intent(this, MediaNotificationService.class).setAction(ACTION_PREV);
        PendingIntent prevPending = PendingIntent.getService(
                this, 1, prevIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Intent playPauseIntent = new Intent(this, MediaNotificationService.class)
                .setAction(isCurrentlyPlaying ? ACTION_PAUSE : ACTION_PLAY);
        PendingIntent playPausePending = PendingIntent.getService(
                this, 2, playPauseIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Intent nextIntent = new Intent(this, MediaNotificationService.class).setAction(ACTION_NEXT);
        PendingIntent nextPending = PendingIntent.getService(
                this, 3, nextIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        int playPauseIcon = isCurrentlyPlaying ? R.drawable.ic_media_pause : R.drawable.ic_media_play;
        String playPauseTitle = isCurrentlyPlaying ? "Pause" : "Play";

        androidx.media.app.NotificationCompat.MediaStyle mediaStyle = new androidx.media.app.NotificationCompat.MediaStyle()
                .setMediaSession(mediaSession.getSessionToken())
                .setShowActionsInCompactView(0, 1, 2);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setStyle(mediaStyle)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(currentTitle)
                .setContentText(currentArtist)
                .setSubText(currentAlbum)
                .setContentIntent(contentIntent)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(isCurrentlyPlaying)
                .setSilent(true)
                .addAction(R.drawable.ic_media_prev, "Previous", prevPending)
                .addAction(playPauseIcon, playPauseTitle, playPausePending)
                .addAction(R.drawable.ic_media_next, "Next", nextPending);

        if (cachedArtBitmap != null) {
            builder.setLargeIcon(cachedArtBitmap);
        }

        return builder.build();
    }

    private Bitmap downloadBitmap(String urlStr) {
        if (urlStr == null || urlStr.isEmpty()) return null;
        try {
            URL url = new URL(urlStr);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(4000);
            connection.setReadTimeout(4000);
            connection.setDoInput(true);
            connection.connect();
            InputStream input = connection.getInputStream();
            return BitmapFactory.decodeStream(input);
        } catch (Exception e) {
            return null;
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Mezzo Playback Controls",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Controls and active track details for Mezzo Music");
            channel.setShowBadge(false);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    private void stopPlaybackService() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        stopForeground(true);
        if (notificationManager != null) {
            notificationManager.cancel(NOTIFICATION_ID);
        }
        stopSelf();
    }

    @Override
    public void onDestroy() {
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        imageExecutor.shutdown();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
