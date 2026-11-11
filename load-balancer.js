
const express = require('express');
const http = require('http');
const crypto = require('crypto');

const app = express();

const PORT = 3000;

// Algoritmo escolhido
const ALGORITHM = process.env.ALGORITHM || 'round-robin';

// Lista de servidores
const servers = [
    { host: 'localhost', port: 3001 },
    { host: 'localhost', port: 3002 },
    { host: 'localhost', port: 3003 }
];

// Controle do Round Robin
let currentIndex = 0;

// Seleciona o servidor de acordo com o algoritmo
function selectServer(req) {

    // Algoritmo IP Hash
    if (ALGORITHM === 'ip-hash') {

        const clientIp = req.socket.remoteAddress;

        const hash = crypto
            .createHash('sha256')
            .update(clientIp)
            .digest('hex');

        const hashNumber = parseInt(hash.substring(0, 8), 16);

        const serverIndex = hashNumber % servers.length;

        return servers[serverIndex];
    }

    // Algoritmo Round Robin
    if (ALGORITHM === 'round-robin') {

        const server = servers[currentIndex];

        currentIndex = (currentIndex + 1) % servers.length;

        return server;
    }

    throw new Error('Algoritmo inválido: ' + ALGORITHM);
}

// Recebe todas as requisições
app.use((req, res) => {

    let server;

    try {
        server = selectServer(req);
    } catch (error) {
        console.error(error.message);
        return res.status(500).send(error.message);
    }

    console.log(`Algoritmo: ${ALGORITHM}`);
    console.log(`Encaminhando para: ${server.port}`);

    const proxyReq = http.request({
        hostname: server.host,
        port: server.port,
        path: req.originalUrl,
        method: req.method,
        headers: {
            ...req.headers,
            host: `${server.host}:${server.port}`
        }
    }, (proxyRes) => {

        res.writeHead(proxyRes.statusCode, proxyRes.headers);

        proxyRes.pipe(res);
    });

    proxyReq.on('error', (error) => {
        console.error('Erro ao conectar ao servidor:', error.message);

        if (!res.headersSent) {
            res.status(502).send('Servidor indisponível');
        }
    });

    req.pipe(proxyReq);
});

// Inicializa o balanceador
app.listen(PORT, () => {
    console.log(`Load Balancer rodando na porta ${PORT}`);
    console.log(`Algoritmo selecionado: ${ALGORITHM}`);
});
