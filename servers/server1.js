
const express = require('express');

const app = express();

app.get('/health', (req, res) => {
    res.json({
        status: 'online',
        server: 'Servidor 1'
    });
});

const PORT = 3001;

app.get('/', (req, res) => {
    res.send('ShopNow - Servidor 1 funcionando!');
});

app.listen(PORT, () => {
    console.log(`Servidor 1 rodando na porta ${PORT}`);
});
