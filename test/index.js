const requestAlpn = require('../index');
const net = require('net');
const https = require('https');
const tls = require('tls');

const ALPNProtocols = ['http/1.1'];

const createCert = require('util').promisify(require('pem').createCertificate);
const httpRequestOptions = { agent: false, rejectUnauthorized: false };
const httpResponse = (req,res) => res.end('OK');

module.exports = async t => {

  const httpsConfig = await createCert({ days: 1, selfSigned: true })
    .then(d => { return { key: d.serviceKey, cert: d.certificate }; });

  t.test('Normally there are no ALPN protocols defined', async t => {
    await new Promise(resolve => {
      const server = https.createServer({ ALPNProtocols, ...httpsConfig }, httpResponse);
      server.on('secureConnection', socket => {
        t.same(socket.alpnProtocol, false);
        server.close();
        resolve();
      });
      server.listen();
      requestAlpn(`https://localhost:${server.address().port}`, { ...httpRequestOptions });
    });
  });

  t.test('Valid ALPN protocols are passed', async t => {
    await new Promise(resolve => {
      const server = https.createServer({ ALPNProtocols, ...httpsConfig }, httpResponse);
      server.on('secureConnection', socket => {
        t.same([socket.alpnProtocol], ALPNProtocols);
        server.close();
        resolve();
      });
      server.listen();
      requestAlpn(`https://localhost:${server.address().port}`, {
        ALPNProtocols,
        ...httpRequestOptions
      });
    });
  });

  t.test('Invalid ALPN protocols are not used', async t => {
    await new Promise(resolve => {
      const server = https.createServer({ ALPNProtocols, ...httpsConfig }, httpResponse);
      server.on('secureConnection', socket => {
        t.same(socket.alpnProtocol, false);
        server.close();
        resolve();
      });
      server.listen();
      requestAlpn(`https://localhost:${server.address().port}`, {
        ALPNProtocols: ['http/5.5'],
        ...httpRequestOptions
      });
    });
  });

};

if (!module.parent) module.exports(require('tap'));
