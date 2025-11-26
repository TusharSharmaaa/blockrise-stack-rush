package com.blockrise.stackrush.ads;

import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;

import androidx.annotation.Nullable;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdLoader;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.nativead.NativeAd;
import com.google.android.gms.ads.nativead.NativeAdOptions;
import com.google.android.gms.ads.nativead.NativeAdView;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@CapacitorPlugin(name = "NativeAd")
public class NativeAdPlugin extends Plugin {

    private Handler mainHandler;
    // Store loaded native ads with their IDs so we can handle clicks
    private final Map<String, NativeAd> loadedAds = new HashMap<>();
    
    // Lazy initialization of Handler to avoid deprecation warnings
    private Handler getMainHandler() {
        if (mainHandler == null) {
            // Use Handler.createAsync for API 30+ to avoid deprecation warning
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                mainHandler = Handler.createAsync(Looper.getMainLooper());
            } else {
                // For older APIs, use the traditional constructor
                mainHandler = new Handler(Looper.getMainLooper());
            }
        }
        return mainHandler;
    }

    @PluginMethod
    public void loadAd(final PluginCall call) {
        final String adUnitId = call.getString("adUnitId");
        if (adUnitId == null || adUnitId.trim().isEmpty()) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("errorMessage", "adUnitId is required");
            call.resolve(result);
            return;
        }

        try {
            getMainHandler().post(() -> {
                try {
                    NativeAdOptions options = new NativeAdOptions.Builder()
                        .setReturnUrlsForImageAssets(true)
                        .build();

                    AdLoader adLoader = new AdLoader.Builder(getContext(), adUnitId)
                        .forNativeAd(nativeAd -> resolveWithAd(call, nativeAd))
                        .withNativeAdOptions(options)
                        .withAdListener(new AdListener() {
                            @Override
                            public void onAdFailedToLoad(LoadAdError loadAdError) {
                                JSObject result = new JSObject();
                                result.put("success", false);
                                String errorMessage = loadAdError.getMessage();
                                if (errorMessage == null || errorMessage.isEmpty()) {
                                    errorMessage = "Failed to load native ad. Please try again.";
                                }
                                result.put("errorMessage", errorMessage);
                                call.resolve(result);
                            }
                        })
                        .build();

                    adLoader.loadAd(new AdRequest.Builder().build());
                } catch (Exception e) {
                    JSObject result = new JSObject();
                    result.put("success", false);
                    result.put("errorMessage", "Error loading ad: " + e.getMessage());
                    call.resolve(result);
                }
            });
        } catch (Exception e) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("errorMessage", "Error initializing ad loader: " + e.getMessage());
            call.resolve(result);
        }
    }

    private void resolveWithAd(PluginCall call, NativeAd nativeAd) {
        // Generate a unique ID for this ad
        String adId = UUID.randomUUID().toString();
        
        // Store the ad so we can handle clicks later
        // Clean up old ads to prevent memory leaks (keep only the most recent)
        if (loadedAds.size() > 5) {
            // Remove oldest ad (simple cleanup - in production you might want more sophisticated tracking)
            String oldestId = loadedAds.keySet().iterator().next();
            NativeAd oldAd = loadedAds.remove(oldestId);
            if (oldAd != null) {
                oldAd.destroy();
            }
        }
        loadedAds.put(adId, nativeAd);
        
        JSObject adObject = new JSObject();
        adObject.put("adId", adId); // Include ad ID so we can reference it for clicks
        adObject.put("headline", nativeAd.getHeadline());
        adObject.put("body", nativeAd.getBody());
        adObject.put("advertiser", nativeAd.getAdvertiser());
        adObject.put("callToAction", nativeAd.getCallToAction());
        adObject.put("store", nativeAd.getStore());
        adObject.put("price", nativeAd.getPrice());

        Double rating = getStarRating(nativeAd);
        if (rating != null) {
            adObject.put("starRating", rating);
        }

        if (nativeAd.getIcon() != null && nativeAd.getIcon().getUri() != null) {
            adObject.put("iconUrl", nativeAd.getIcon().getUri().toString());
        }

        JSArray imageUrls = new JSArray();
        for (NativeAd.Image image : nativeAd.getImages()) {
            if (image != null && image.getUri() != null) {
                imageUrls.put(image.getUri().toString());
            }
        }
        adObject.put("imageUrls", imageUrls);
        adObject.put("extraLabel", nativeAd.getAdvertiser() != null ? nativeAd.getAdvertiser() : "Sponsored");

        JSObject result = new JSObject();
        result.put("success", true);
        result.put("ad", adObject);

        // Don't destroy the ad - keep it alive for click handling
        call.resolve(result);
    }
    
    @PluginMethod
    public void performClick(final PluginCall call) {
        final String adId = call.getString("adId");
        if (adId == null || adId.trim().isEmpty()) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("errorMessage", "adId is required");
            call.resolve(result);
            return;
        }

        final NativeAd nativeAd = loadedAds.get(adId);
        if (nativeAd == null) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("errorMessage", "Ad not found or already destroyed");
            call.resolve(result);
            return;
        }

        try {
            getMainHandler().post(() -> {
                try {
                    // Get the current activity's root view
                    android.app.Activity activity = getActivity();
                    if (activity == null) {
                        JSObject result = new JSObject();
                        result.put("success", false);
                        result.put("errorMessage", "Activity not available");
                        call.resolve(result);
                        return;
                    }
                    
                    ViewGroup rootView = (ViewGroup) activity.findViewById(android.R.id.content);
                    if (rootView == null) {
                        JSObject result = new JSObject();
                        result.put("success", false);
                        result.put("errorMessage", "Root view not available");
                        call.resolve(result);
                        return;
                    }
                    
                    // Create a temporary invisible container to hold the NativeAdView
                    // This is required because AdMob needs views to be in the view hierarchy
                    FrameLayout container = new FrameLayout(getContext());
                    container.setLayoutParams(new ViewGroup.LayoutParams(1, 1));
                    container.setVisibility(View.INVISIBLE);
                    container.setAlpha(0f);
                    
                    // Create NativeAdView and required views
                    NativeAdView adView = new NativeAdView(getContext());
                    
                    // Create views for required ad elements
                    android.widget.TextView headlineView = new android.widget.TextView(getContext());
                    headlineView.setText(nativeAd.getHeadline());
                    
                    Button callToActionView = new Button(getContext());
                    if (nativeAd.getCallToAction() != null) {
                        callToActionView.setText(nativeAd.getCallToAction());
                    }
                    
                    // Add views to the NativeAdView
                    adView.addView(headlineView);
                    adView.addView(callToActionView);
                    
                    // Register views with the native ad (required for click tracking)
                    adView.setHeadlineView(headlineView);
                    adView.setCallToActionView(callToActionView);
                    
                    // Add NativeAdView to container
                    container.addView(adView);
                    
                    // Add container to root view (temporarily, invisibly)
                    rootView.addView(container);
                    
                    // Set the native ad to the view (this enables click tracking)
                    // This must be done AFTER adding to view hierarchy
                    adView.setNativeAd(nativeAd);
                    
                    // Small delay to ensure view is fully attached
                    getMainHandler().postDelayed(() -> {
                        try {
                            // Trigger click on the call-to-action button
                            // This will open the ad's destination URL
                            callToActionView.performClick();
                            
                            // Remove the container after a short delay to allow click to process
                            getMainHandler().postDelayed(() -> {
                                try {
                                    rootView.removeView(container);
                                } catch (Exception e) {
                                    // Ignore errors when removing view
                                }
                            }, 500);
                            
                            JSObject result = new JSObject();
                            result.put("success", true);
                            call.resolve(result);
                        } catch (Exception e) {
                            JSObject result = new JSObject();
                            result.put("success", false);
                            result.put("errorMessage", "Error performing click: " + e.getMessage());
                            call.resolve(result);
                            
                            // Clean up on error
                            try {
                                rootView.removeView(container);
                            } catch (Exception cleanupError) {
                                // Ignore
                            }
                        }
                    }, 100);
                    
                } catch (Exception e) {
                    JSObject result = new JSObject();
                    result.put("success", false);
                    result.put("errorMessage", "Error performing click: " + e.getMessage());
                    call.resolve(result);
                }
            });
        } catch (Exception e) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("errorMessage", "Error initializing click: " + e.getMessage());
            call.resolve(result);
        }
    }
    
    @PluginMethod
    public void destroyAd(final PluginCall call) {
        final String adId = call.getString("adId");
        if (adId != null && !adId.trim().isEmpty()) {
            NativeAd nativeAd = loadedAds.remove(adId);
            if (nativeAd != null) {
                nativeAd.destroy();
            }
        }
        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }

    @Nullable
    private Double getStarRating(NativeAd nativeAd) {
        if (nativeAd.getStarRating() == null) {
            return null;
        }
        return nativeAd.getStarRating().doubleValue();
    }
}

