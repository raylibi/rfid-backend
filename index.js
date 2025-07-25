const express = require('express');
const cors = require('cors');
const kontainerRoutes = require('./routes/kontainer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/kontainer', kontainerRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});
