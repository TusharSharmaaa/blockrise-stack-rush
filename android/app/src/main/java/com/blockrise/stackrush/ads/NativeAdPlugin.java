package com.blockrise.stackrush.ads;

import android.os.Handler;
import android.os.Looper;

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

@CapacitorPlugin(name = "NativeAd")
public class NativeAdPlugin extends Plugin {

    private final Handler mainHandler = new Handler(Looper.getMainLooper());

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
            mainHandler.post(() -> {
                try {
                    NativeAdOptions options = new NativeAdOptions.Builder()
                        .setReturnUrlsForImageAssets(true)
                        .build();

                    AdLoader adLoader = new AdLoader.Builder(getContext(), adUnitId)
                        .forNativeAd(nativeAd -> {
                            if (!call.isReleased()) {
                                resolveWithAd(call, nativeAd);
                            }
                        })
                        .withNativeAdOptions(options)
                        .withAdListener(new AdListener() {
                            @Override
                            public void onAdFailedToLoad(LoadAdError loadAdError) {
                                if (!call.isReleased()) {
                                    JSObject result = new JSObject();
                                    result.put("success", false);
                                    String errorMessage = loadAdError.getMessage();
                                    if (errorMessage == null || errorMessage.isEmpty()) {
                                        errorMessage = "Failed to load native ad. Please try again.";
                                    }
                                    result.put("errorMessage", errorMessage);
                                    call.resolve(result);
                                }
                            }
                        })
                        .build();

                    adLoader.loadAd(new AdRequest.Builder().build());
                } catch (Exception e) {
                    if (!call.isReleased()) {
                        JSObject result = new JSObject();
                        result.put("success", false);
                        result.put("errorMessage", "Error loading ad: " + e.getMessage());
                        call.resolve(result);
                    }
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
        JSObject adObject = new JSObject();
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

        nativeAd.destroy();
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

