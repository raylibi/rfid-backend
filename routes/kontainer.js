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

module.exports = router;
