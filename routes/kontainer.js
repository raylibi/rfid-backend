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

  try {
    const result = await db.query('DELETE FROM save_container WHERE epc = $1', [epc]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
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

// --- Endpoint full-info
router.get('/full-info/:epc', async (req, res) => {
  const { epc } = req.params;

  try {
    const kontainerResult = await db.query(
      `SELECT epc, nomor_kontainer FROM save_container WHERE epc = $1`,
      [epc]
    );

    if (kontainerResult.rows.length === 0) {
      return res.json({
        epc,
        nomor_kontainer: null,
        is_parent: false,
        children: []
      });
    }

    const childResult = await db.query(
      `SELECT c.epc, c.nomor_kontainer
       FROM container_item ci
       JOIN save_container c ON c.epc = ci.child_epc
       WHERE ci.parent_epc = $1`,
      [epc]
    );

    res.json({
      ...kontainerResult.rows[0],
      is_parent: childResult.rows.length > 0,
      children: childResult.rows
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
