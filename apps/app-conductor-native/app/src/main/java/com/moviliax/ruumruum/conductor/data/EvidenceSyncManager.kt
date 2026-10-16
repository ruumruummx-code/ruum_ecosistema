package com.moviliax.ruumruum.conductor.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File
import java.time.Instant
import java.util.UUID

@Serializable
data class LocalEvidenceRecord(
    val id: String,
    val tripId: String,
    val type: String,
    val angle: String,
    val filePath: String,
    val capturedAt: String,
    val synced: Boolean = false,
)

data class SyncResult(
    val totalPending: Int,
    val syncedCount: Int,
    val failedCount: Int,
)

class EvidenceSyncManager(private val baseDir: File) {

    private val json = Json { prettyPrint = true; ignoreUnknownKeys = true }
    private val mutex = Mutex()
    private val queueFile: File
        get() = File(baseDir, "pending_evidence_queue.json")

    private val photosDir: File
        get() = File(baseDir, "evidence_photos").apply { mkdirs() }

    init {
        baseDir.mkdirs()
    }

    suspend fun saveLocally(
        tripId: String,
        type: String,
        angle: String,
        bytes: ByteArray,
    ): LocalEvidenceRecord = withContext(Dispatchers.IO) {
        val id = UUID.randomUUID().toString()
        val tripDir = File(photosDir, "$tripId/$type").apply { mkdirs() }
        val photoFile = File(tripDir, "$id-$angle.jpg")
        photoFile.writeBytes(bytes)

        val record = LocalEvidenceRecord(
            id = id,
            tripId = tripId,
            type = type,
            angle = angle,
            filePath = photoFile.absolutePath,
            capturedAt = Instant.now().toString(),
            synced = false,
        )

        mutex.withLock {
            val records = loadRecords().filterNot { it.tripId == tripId && it.type == type && it.angle == angle }
            saveRecords(records + record)
        }

        record
    }

    suspend fun markAsSynced(id: String) = withContext(Dispatchers.IO) {
        mutex.withLock {
            val records = loadRecords().map {
                if (it.id == id) it.copy(synced = true) else it
            }
            saveRecords(records)
        }
    }

    suspend fun removeRecord(id: String) = withContext(Dispatchers.IO) {
        mutex.withLock {
            val records = loadRecords()
            val target = records.find { it.id == id }
            target?.let { File(it.filePath).delete() }
            saveRecords(records.filterNot { it.id == id })
        }
    }

    suspend fun getPendingRecords(tripId: String? = null): List<LocalEvidenceRecord> = withContext(Dispatchers.IO) {
        mutex.withLock {
            val all = loadRecords().filterNot { it.synced }
            if (tripId != null) all.filter { it.tripId == tripId } else all
        }
    }

    suspend fun getLocalPhotos(tripId: String, type: String): List<LocalEvidenceRecord> = withContext(Dispatchers.IO) {
        mutex.withLock {
            loadRecords().filter { it.tripId == tripId && it.type == type }
        }
    }

    private fun loadRecords(): List<LocalEvidenceRecord> {
        if (!queueFile.exists()) return emptyList()
        return runCatching {
            json.decodeFromString<List<LocalEvidenceRecord>>(queueFile.readText())
        }.getOrDefault(emptyList())
    }

    private fun saveRecords(records: List<LocalEvidenceRecord>) {
        runCatching {
            queueFile.writeText(json.encodeToString(records))
        }
    }
}
