const { execSync } = require('child_process');
const fs = require('fs');

const linksFile = 'links.txt';

if (!fs.existsSync(linksFile)) {
  console.error('❌ No se encontró el archivo links.txt');
  process.exit(1);
}

if (!fs.existsSync('./audio')) {
  fs.mkdirSync('./audio');
}

const lines = fs.readFileSync(linksFile, 'utf-8')
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0);

let audioIndex = fs.readdirSync('./audio')
  .filter(f => f.startsWith('audio') && f.endsWith('.mp3'))
  .length;

lines.forEach((line, i) => {
  const match = line.match(/^"(.+?)"\s+(\d+)\s+(\d+)\s+"(.+?)"$/);

  if (!match) {
    console.warn(`⚠️ Línea ${i + 1} inválida: "${line}"`);
    return;
  }

  const [, urlRaw, startStr, endStr, name] = match;
  const url = urlRaw.split('&')[0];
  const start = parseInt(startStr);
  const end = parseInt(endStr);
  const duration = end - start;

  if (isNaN(start) || isNaN(end) || duration <= 0) {
    console.warn(`⚠️ Tiempos inválidos en línea ${i + 1}: "${line}"`);
    return;
  }

  const tempFile = `./audio/temp_audio_${audioIndex}.m4a`;
  const output = `./audio/audio${audioIndex}"${name}".mp3`;

  try {
    console.log(`⬇️ Descargando audio ${audioIndex}: ${name}`);
    execSync(`yt-dlp -f bestaudio -x --audio-format m4a -o "${tempFile}" "${url}"`, { stdio: 'inherit' });

    console.log(`🎬 Cortando fragmento (${start}s - ${end}s)...`);
    execSync(`ffmpeg -ss ${start} -t ${duration} -i "${tempFile}" -vn -acodec libmp3lame "${output}"`, { stdio: 'inherit' });

    fs.unlinkSync(tempFile);
    console.log(`✅ Audio guardado como ${output}\n`);
    audioIndex++;
  } catch (err) {
    console.error(`❌ Error al procesar línea ${i + 1}: ${err.message}`);
  }
});
