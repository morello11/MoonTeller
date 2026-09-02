#!/usr/bin/env node
// Swiss Ephemeris .data paketinden gereksiz dosyaları çıkarır ve loader'daki dosya tablosunu günceller.
// Tek seferlik vendor işlemi; uygulamanın build adımı değildir. Tekrar çalıştırmak zararsızdır.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// seasnam.txt: asteroit isim listesi (9,9 MB). sepl_18/semo_18: gezegen ve Ay efemerisi; Moshier hesabı (SEFLG_MOSEPH)
// bunlar olmadan da < 0,001° hassasiyet verir. seas_18 kalır: Chiron için gerekli.
const DROP = ['/sweph/seasnam.txt', '/sweph/sepl_18.se1', '/sweph/semo_18.se1'];

const wsamDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'vendor', 'swisseph', 'wsam');
const jsPath = join(wsamDir, 'swisseph.js');
const dataPath = join(wsamDir, 'swisseph.data');

function parseTable(js) {
  const match = js.match(/loadPackage\(\{files:\[([\s\S]*?)\],remote_package_size:(\d+)\}\)/);
  if (!match) throw new Error('loadPackage tablosu bulunamadı');
  const entries = [...match[1].matchAll(/\{filename:"([^"]+)",start:(\d+),end:(\d+)\}/g)]
    .map((m) => ({ filename: m[1], start: Number(m[2]), end: Number(m[3]) }));
  return { literal: match[0], size: Number(match[2]), entries };
}

function repack(entries, data) {
  const kept = [];
  const chunks = [];
  let offset = 0;
  for (const entry of entries) {
    const length = entry.end - entry.start;
    if (DROP.includes(entry.filename)) {
      console.log(`atıldı: ${entry.filename} (${length} bayt)`);
      continue;
    }
    chunks.push(data.subarray(entry.start, entry.end));
    kept.push({ filename: entry.filename, start: offset, end: offset + length });
    offset += length;
  }
  return { kept, data: Buffer.concat(chunks) };
}

const js = readFileSync(jsPath, 'utf8');
const table = parseTable(js);
const data = readFileSync(dataPath);
if (data.length !== table.size) {
  throw new Error(`.data boyutu (${data.length}) tabloyla (${table.size}) uyuşmuyor`);
}

const result = repack(table.entries, data);
const literal = result.kept.map((e) => `{filename:"${e.filename}",start:${e.start},end:${e.end}}`).join(',');
writeFileSync(jsPath, js.replace(table.literal, `loadPackage({files:[${literal}],remote_package_size:${result.data.length}})`));
writeFileSync(dataPath, result.data);
console.log(`yeni .data: ${result.data.length} bayt, ${result.kept.length} dosya`);
