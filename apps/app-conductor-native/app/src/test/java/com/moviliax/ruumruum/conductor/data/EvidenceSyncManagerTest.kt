package com.moviliax.ruumruum.conductor.data

import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.io.File
import java.nio.file.Files

class EvidenceSyncManagerTest {

    private lateinit var tempDir: File
    private lateinit var syncManager: EvidenceSyncManager

    @Before
    fun setUp() {
        tempDir = Files.createTempDirectory("evidence-sync-test").toFile()
        syncManager = EvidenceSyncManager(tempDir)
    }

    @After
    fun tearDown() {
        tempDir.deleteRecursively()
    }

    @Test
    fun `saveLocally creates photo file and records pending metadata`() = runTest {
        val bytes = "fake-photo-data-frente".toByteArray()
        val record = syncManager.saveLocally(
            tripId = "trip-100",
            type = "inicial",
            angle = "frente",
            bytes = bytes,
        )

        assertFalse(record.synced)
        assertEquals("trip-100", record.tripId)
        assertEquals("inicial", record.type)
        assertEquals("frente", record.angle)

        val file = File(record.filePath)
        assertTrue(file.exists())
        assertArrayEquals(bytes, file.readBytes())

        val pending = syncManager.getPendingRecords("trip-100")
        assertEquals(1, pending.size)
        assertEquals(record.id, pending[0].id)
    }

    @Test
    fun `saveLocally replaces previous photo for same trip type and angle`() = runTest {
        val bytes1 = "photo-v1".toByteArray()
        val bytes2 = "photo-v2".toByteArray()

        val record1 = syncManager.saveLocally("trip-100", "inicial", "tablero", bytes1)
        val record2 = syncManager.saveLocally("trip-100", "inicial", "tablero", bytes2)

        val pending = syncManager.getPendingRecords("trip-100")
        assertEquals(1, pending.size)
        assertEquals(record2.id, pending[0].id)

        val file2 = File(record2.filePath)
        assertTrue(file2.exists())
        assertArrayEquals(bytes2, file2.readBytes())
    }

    @Test
    fun `markAsSynced updates record synced status and removes from pending`() = runTest {
        val record = syncManager.saveLocally("trip-100", "inicial", "lado_piloto", "piloto-bytes".toByteArray())

        assertEquals(1, syncManager.getPendingRecords("trip-100").size)

        syncManager.markAsSynced(record.id)

        val pending = syncManager.getPendingRecords("trip-100")
        assertEquals(0, pending.size)

        val localPhotos = syncManager.getLocalPhotos("trip-100", "inicial")
        assertEquals(1, localPhotos.size)
        assertTrue(localPhotos[0].synced)
    }

    @Test
    fun `removeRecord deletes local file and queue metadata`() = runTest {
        val record = syncManager.saveLocally("trip-100", "inicial", "trasera", "trasera-bytes".toByteArray())
        val file = File(record.filePath)
        assertTrue(file.exists())

        syncManager.removeRecord(record.id)

        assertFalse(file.exists())
        assertEquals(0, syncManager.getPendingRecords("trip-100").size)
        assertEquals(0, syncManager.getLocalPhotos("trip-100", "inicial").size)
    }

    @Test
    fun `filters pending records by tripId or returns all`() = runTest {
        syncManager.saveLocally("trip-1", "inicial", "frente", "1-frente".toByteArray())
        syncManager.saveLocally("trip-1", "inicial", "trasera", "1-trasera".toByteArray())
        syncManager.saveLocally("trip-2", "final", "frente", "2-frente".toByteArray())

        val trip1Pending = syncManager.getPendingRecords("trip-1")
        assertEquals(2, trip1Pending.size)

        val trip2Pending = syncManager.getPendingRecords("trip-2")
        assertEquals(1, trip2Pending.size)

        val allPending = syncManager.getPendingRecords(null)
        assertEquals(3, allPending.size)
    }
}
