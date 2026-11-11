
const express = require('express');

const app = express();

const PORT = 3003;

app.get('/', (req, res) => {
    res.send('ShopNow - Servidor 3 funcionando!');
});

app.listen(PORT, () => {
    console.log(`Servidor 3 rodando na porta ${PORT}`);
});
