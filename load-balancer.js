
const express = require('express');
const http = require('http');

const app = express();

const PORT = 3000;

// Lista de servidores disponíveis
const servers = [
    { host: 'localhost', port: 3001 },
    { host: 'localhost', port: 3002 },
    { host: 'localhost', port: 3003 }
];

// Índice do servidor que receberá a próxima requisição
let currentIndex = 0;

// Recebe todas as requisições
app.use((req, res) => {

    // Seleciona o servidor atual
    const server = servers[currentIndex];

    // Avança para o próximo servidor
    currentIndex = (currentIndex + 1) % servers.length;

    console.log(`Encaminhando requisição para: ${server.port}`);

    // Encaminha a requisição ao servidor escolhido
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

        // Devolve a resposta do servidor ao cliente
        res.writeHead(proxyRes.statusCode, proxyRes.headers);

        proxyRes.pipe(res);
    });

    // Trata erros de comunicação
    proxyReq.on('error', (error) => {
        console.error('Erro ao conectar ao servidor:', error.message);

        if (!res.headersSent) {
            res.status(502).send('Servidor indisponível');
        }
    });

    // Encaminha o conteúdo da requisição
    req.pipe(proxyReq);
});

// Inicializa o balanceador
app.listen(PORT, () => {
    console.log(`Load Balancer rodando na porta ${PORT}`);
});
