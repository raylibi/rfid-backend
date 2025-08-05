const express = require('express');
const router = express.Router();
const db = require('../db');

// Simpan EPC + nomor kontainer
router.post('/save', async (req, res) => {
  const { epc, nomor_kontainer } = req.body;

  try {
    await db.query(
      `INSERT INTO save_container (epc, nomor_kontainer) VALUES ($1, $2)
       ON CONFLICT (epc) DO UPDATE SET nomor_kontainer = EXCLUDED.nomor_kontainer`,
      [epc, nomor_kontainer]
    );
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Ambil kontainer berdasarkan EPC
router.get('/get/:epc', async (req, res) => {
  const { epc } = req.params;

  try {
    const result = await db.query(
      'SELECT * FROM save_container WHERE epc = $1',
      [epc]
    );
    res.json(result.rows[0] || {});
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.delete('/delete/:epc', async (req, res) => {
  const { epc } = req.params;
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // 1. Hapus semua relasi di container_item dimana EPC ini sebagai parent
    await client.query('DELETE FROM container_item WHERE parent_epc = $1', [epc]);
    
    // 2. Hapus semua relasi di container_item dimana EPC ini sebagai child
    await client.query('DELETE FROM container_item WHERE child_epc = $1', [epc]);
    
    // 3. Hapus dari save_container
    const deleteResult = await client.query('DELETE FROM save_container WHERE epc = $1', [epc]);

    await client.query('COMMIT');
    
    console.log(`Successfully deleted EPC ${epc} and all its relations`);
    res.json({ 
      success: true, 
      message: `Container ${epc} and all its relations deleted successfully`,
      deletedRows: deleteResult.rowCount 
    });
    
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error deleting container:', e);
    res.status(500).json({ 
      success: false, 
      error: e.message 
    });
  } finally {
    client.release();
  }
});

// --- [Baru] Tambahkan child ke parent box
router.post('/add-item', async (req, res) => {
  const { parent_epc, child_epc } = req.body;

  try {
    await db.query(
      `INSERT INTO container_item (parent_epc, child_epc)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [parent_epc, child_epc]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- [Baru] Hapus child dari parent box
router.post('/remove-item', async (req, res) => {
  const { parent_epc, child_epc } = req.body;

  if (!parent_epc || !child_epc) {
    return res.status(400).json({ success: false, error: "parent_epc and child_epc are required." });
  }

  try {
    await db.query(
      `DELETE FROM container_item WHERE parent_epc = $1 AND child_epc = $2`,
      [parent_epc, child_epc]
    );
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- Endpoint full-info
router.get('/full-info/:epc', async (req, res) => {
  const { epc } = req.params;

  try {
    // Siapkan kedua promise query TANPA 'await'
    const parentPromise = db.query(
      `SELECT nomor_kontainer FROM save_container WHERE epc = $1`,
      [epc]
    );
    const childrenPromise = db.query(
      `SELECT c.epc, c.nomor_kontainer
       FROM container_item ci
       JOIN save_container c ON c.epc = ci.child_epc
       WHERE ci.parent_epc = $1`,
      [epc]
    );

    // Jalankan kedua promise secara bersamaan dan tunggu keduanya selesai
    const [kontainerResult, childResult] = await Promise.all([
      parentPromise,
      childrenPromise,
    ]);

    // Gabungkan hasilnya seperti sebelumnya
    res.json({
      epc: epc,
      nomor_kontainer: kontainerResult.rows[0]?.nomor_kontainer || null,
      is_parent: childResult.rows.length > 0,
      children: childResult.rows,
    });
    
  } catch (e) {
    console.error("Error fetching full info:", e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
