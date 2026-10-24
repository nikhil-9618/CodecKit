// pages/subnet.js — IPv4 CIDR calculator. Pure arithmetic, live while typing.
import { debounce } from '/lib/debounce.js';

const input = document.querySelector('[data-cidr]');

function parseCIDR(text) {
  const m = /^\s*(\d{1,3}(?:\.\d{1,3}){3})(?:\/(\d{1,2}))?\s*$/.exec(text);
  if (!m) throw new Error('Invalid CIDR input: expected e.g. 192.168.1.130/26');
  const parts = m[1].split('.');
  if (parts.some((p) => Number(p) > 255)) throw new Error('Invalid CIDR input: octet > 255');
  const prefix = m[2] === undefined ? 24 : Number(m[2]);
  if (prefix > 32) throw new Error('Invalid CIDR input: prefix must be ≤ 32');
  return { ip: parts.map(Number), prefix };
}

const ipToInt = (ip) => ((ip[0] << 24) >>> 0) + (ip[1] << 16) + (ip[2] << 8) + ip[3];
const intToIp = (n) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');
const pad = (n) => (n.toString(2).padStart(8, '0'));
const bin32 = (n) => [24, 16, 8, 0].map((s) => pad((n >>> s) & 255)).join('.');
const set = (sel, v) => { const el = document.querySelector(sel); if (el) el.textContent = v; };

input?.addEventListener('input', debounce(() => {
  const errEl = document.querySelector('[data-error]');
  const binSection = document.querySelector('[data-binary]');
  try {
    const { ip, prefix } = parseCIDR(input.value);
    const maskInt = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    const ipInt = ipToInt(ip);
    const network = (ipInt & maskInt) >>> 0;
    const wildcard = (~maskInt) >>> 0;
    const broadcast = (network | wildcard) >>> 0;
    const total = 2 ** (32 - prefix);
    const usable = prefix >= 31 ? (prefix === 31 ? 2 : 1) : total - 2;
    const first = prefix >= 31 ? network : network + 1;
    const last = prefix >= 31 ? broadcast : broadcast - 1;

    set('[data-network]', `${intToIp(network)} /${prefix}`);
    set('[data-broadcast]', intToIp(broadcast));
    set('[data-mask]', intToIp(maskInt));
    set('[data-wildcard]', intToIp(wildcard));
    set('[data-range]', `${intToIp(first)} — ${intToIp(last)}`);
    set('[data-hosts]', prefix === 32 ? '1 (single host)' : `${usable.toLocaleString()}${prefix >= 31 ? ' (point-to-point, RFC 3021)' : ' usable'}`);
    set('[data-iplclass]', ipClass(ip[0]));

    binSection.hidden = false;
    set('[data-b-addr]', `${intToIp(ipInt)}  = ${bin32(ipInt)}`);
    set('[data-b-mask]', `${intToIp(maskInt).padEnd(15)}  = ${bin32(maskInt)}`);
    set('[data-b-net]', `${intToIp(network).padEnd(15)}  = ${bin32(network)}   (address AND mask)`);
    set('[data-b-bcast]', `${intToIp(broadcast).padEnd(15)}  = ${bin32(broadcast)}   (network OR wildcard)`);
    errEl.hidden = true;
  } catch (err) {
    errEl.hidden = false;
    errEl.textContent = err.message;
    binSection.hidden = true;
    // Never leave the previous CIDR's numbers on screen as if they were current.
    for (const sel of ['[data-network]', '[data-broadcast]', '[data-mask]', '[data-wildcard]',
      '[data-range]', '[data-hosts]', '[data-iplclass]']) set(sel, '—');
  }
}, 150));
if (input?.value) input.dispatchEvent(new Event('input'));

function ipClass(firstOctet) {
  if (firstOctet < 128) return 'A';
  if (firstOctet < 192) return 'B';
  if (firstOctet < 224) return 'C';
  if (firstOctet < 240) return 'D (multicast)';
  return 'E (reserved)';
}
