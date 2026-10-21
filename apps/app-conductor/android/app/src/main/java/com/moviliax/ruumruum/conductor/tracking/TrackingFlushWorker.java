package com.moviliax.ruumruum.conductor.tracking;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.work.ListenableWorker;
import androidx.work.ListenableWorker.Result;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

/**
 * Worker periódico que hace flush de los puntos de geolocalización pendientes
 * hacia el servidor. Se registra con PeriodicWorkRequest para ejecutarse cada
 * 15 minutos mientras el dispositivo tenga batería y conectividad.
 */
public class TrackingFlushWorker extends Worker {

    public TrackingFlushWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        try {
            boolean ok = TrackingUploadClient.flush(getApplicationContext());
            return ok ? Result.success() : Result.failure();
        } catch (Exception error) {
            NativeErrorReporter.report(getApplicationContext(), "tracking_flush_worker_failed", error);
            return Result.failure();
        }
    }
}
