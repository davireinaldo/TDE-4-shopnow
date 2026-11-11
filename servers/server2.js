
const express = require('express');

const app = express();

app.get('/health', (req, res) => {
    res.json({
        status: 'online',
        server: 'Servidor 2'
    });
});

const PORT = 3002;

app.get('/', (req, res) => {
    res.send('ShopNow - Servidor 2 funcionando!');
});

app.listen(PORT, () => {
    console.log(`Servidor 2 rodando na porta ${PORT}`);
});
