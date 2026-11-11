
const express = require('express');

const app = express();

const PORT = 3002;

app.get('/', (req, res) => {
    res.send('ShopNow - Servidor 2 funcionando!');
});

app.listen(PORT, () => {
    console.log(`Servidor 2 rodando na porta ${PORT}`);
});
