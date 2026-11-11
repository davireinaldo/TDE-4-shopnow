
const express = require('express');

const app = express();

const PORT = 3001;

app.get('/', (req, res) => {
    res.send('ShopNow - Servidor 1 funcionando!');
});

app.listen(PORT, () => {
    console.log(`Servidor 1 rodando na porta ${PORT}`);
});
