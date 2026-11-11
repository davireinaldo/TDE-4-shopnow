
const express = require('express');
const http = require('http');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

const ALGORITHM = process.env.ALGORITHM || 'round-robin';

const servers = [
    { host: 'localhost', port: 3001, isAlive: false },
    { host: 'localhost', port: 3002, isAlive: false },
    { host: 'localhost', port: 3003, isAlive: false }
];

let currentIndex = 0;

// Verifica se um servidor está funcionando
function checkServer(server) {
    return new Promise((resolve) => {
        const request = http.get({
            hostname: server.host,
            port: server.port,
            path: '/health',
            timeout: 2000
        }, (response) => {
            response.resume();

            const isAlive = response.statusCode === 200;

            if (server.isAlive !== isAlive) {
                console.log(
                    `Servidor ${server.port}: ${isAlive ? 'ONLINE' : 'OFFLINE'}`
                );
            }

            server.isAlive = isAlive;
            resolve();
        });

        request.on('timeout', () => {
            request.destroy();
        });

        request.on('error', () => {
            if (server.isAlive) {
                console.log(`Servidor ${server.port}: OFFLINE`);
            }

            server.isAlive = false;
            resolve();
        });
    });
}

// Verifica todos os servidores
async function checkServers() {
    await Promise.all(servers.map(checkServer));
}

// Escolhe um servidor disponível
function selectServer(req) {
    if (ALGORITHM !== 'round-robin' && ALGORITHM !== 'ip-hash') {
        throw new Error('Algoritmo inválido: ' + ALGORITHM);
    }

    const availableServers = servers.filter(server => server.isAlive);

    if (availableServers.length === 0) {
        return null;
    }

    // Algoritmo IP Hash
    if (ALGORITHM === 'ip-hash') {
        const clientIp = req.socket.remoteAddress;

        const hash = crypto
            .createHash('sha256')
            .update(clientIp)
            .digest('hex');

        const hashNumber = parseInt(hash.substring(0, 8), 16);
        const serverIndex = hashNumber % availableServers.length;

        return availableServers[serverIndex];
    }

    // Algoritmo Round Robin
    if (ALGORITHM === 'round-robin') {
        currentIndex = currentIndex % availableServers.length;

        const server = availableServers[currentIndex];

        currentIndex = (currentIndex + 1) % availableServers.length;

        return server;
    }
}

// Encaminha as requisições
app.use((req, res) => {
    let server;

    try {
        server = selectServer(req);
    } catch (error) {
        console.error(error.message);
        return res.status(500).send(error.message);
    }

    if (!server) {
        return res.status(503).send('Nenhum servidor disponível no momento.');
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

// Inicia o balanceador após a primeira verificação
async function startLoadBalancer() {
    await checkServers();

    console.log('\nStatus inicial dos servidores:');

    servers.forEach(server => {
        console.log(
            `Porta ${server.port}: ${server.isAlive ? 'ONLINE' : 'OFFLINE'}`
        );
    });

    app.listen(PORT, () => {
        console.log(`\nLoad Balancer rodando na porta ${PORT}`);
        console.log(`Algoritmo selecionado: ${ALGORITHM}`);
    });

    // Nova verificação a cada 5 segundos
    setInterval(checkServers, 5000);
}

startLoadBalancer();
