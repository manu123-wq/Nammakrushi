import { getDatabase } from '../database/sqlite.ts';
import { FarmTraceability } from '../../types/index.ts';

export class TraceabilityModel {
  static findByProductId(productId: string): FarmTraceability | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM traceability WHERE productId = ?').get(productId) as any;
    if (!row) return null;

    return {
      productId: row.productId,
      productTitle: row.productTitle,
      batchNumber: row.batchNumber,
      harvestDate: row.harvestDate,
      harvestTimestamp: row.harvestTimestamp,
      farmLocation: JSON.parse(row.farmLocationJson || '{}'),
      farmerDetails: JSON.parse(row.farmerDetailsJson || '{}'),
      qualityMetrics: JSON.parse(row.qualityMetricsJson || '{}'),
      transportLogs: JSON.parse(row.transportLogsJson || '[]'),
      verificationHash: row.verificationHash,
      qrPayload: row.qrPayload
    };
  }

  static upsert(trace: FarmTraceability): FarmTraceability {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO traceability (
        productId, productTitle, batchNumber, harvestDate, harvestTimestamp,
        farmLocationJson, farmerDetailsJson, qualityMetricsJson, transportLogsJson,
        verificationHash, qrPayload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(productId) DO UPDATE SET
        batchNumber = excluded.batchNumber,
        harvestDate = excluded.harvestDate,
        harvestTimestamp = excluded.harvestTimestamp,
        farmLocationJson = excluded.farmLocationJson,
        farmerDetailsJson = excluded.farmerDetailsJson,
        qualityMetricsJson = excluded.qualityMetricsJson,
        transportLogsJson = excluded.transportLogsJson,
        verificationHash = excluded.verificationHash,
        qrPayload = excluded.qrPayload,
        updatedAt = CURRENT_TIMESTAMP
    `);

    stmt.run(
      trace.productId,
      trace.productTitle,
      trace.batchNumber,
      trace.harvestDate,
      trace.harvestTimestamp,
      JSON.stringify(trace.farmLocation),
      JSON.stringify(trace.farmerDetails),
      JSON.stringify(trace.qualityMetrics),
      JSON.stringify(trace.transportLogs),
      trace.verificationHash,
      trace.qrPayload
    );

    return trace;
  }
}
