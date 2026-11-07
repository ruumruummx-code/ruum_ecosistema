const fs = require('node:fs');
const path = require('node:path');
const dir = __dirname;
const rows = [390,1440].map(width => {
 const prefs = JSON.parse(fs.readFileSync(path.join(dir, width + '-preferencias.json'), 'utf8'));
 const login = JSON.parse(fs.readFileSync(path.join(dir, width + '-login.json'), 'utf8'));
 return { width, lang: prefs.language, loginLang: login.lang, reload: prefs.reload,
  violations: [...prefs.initial.violations,...prefs.final.violations,...prefs.notifications.violations,...login.violations],
  incomplete: [...prefs.initial.incomplete,...prefs.final.incomplete,...login.incomplete],
  notificationNames: prefs.notificationNames,
  failedAttempts: prefs.attempts.filter(a=>a.failed).length,
  successfulAttempts: prefs.attempts.filter(a=>!a.failed).length,
  generalLanguages: prefs.attempts.filter(a=>a.body.preferencias).map(a=>a.body.preferencias.idioma),
 };
});
const result = { generatedAt: new Date().toISOString(), option: 'B', widths: rows };
fs.writeFileSync(path.join(dir,'resumen.json'),JSON.stringify(result,null,2));
const cards = [];
for (const width of [390,1440]) for (const [suffix,label] of [['preferencias','Preferencias · English deshabilitado'],['503','Fallo 503 · sin falso éxito'],['login','Acceso · sin selector EN']]) cards.push({file:width+'-'+suffix+'.png',label:label+' · '+width+' px'});
cards.push({file:'390-notificaciones.png',label:'Notificaciones móviles · nombres accesibles'});
fs.writeFileSync(path.join(dir,'EVIDENCIA.html'),`<!doctype html><html lang="es-MX"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RUUM-UX-006 · Evidencia</title><style>body{font:16px/1.5 system-ui;color:#0a2342;background:#f5f8fc;max-width:1400px;padding:24px;margin:auto}a{color:#0052cc}table{border-collapse:collapse;background:white;width:100%}td,th{border:1px solid #bac9dd;padding:12px;text-align:left}details{background:#fff;border:1px solid #bac9dd;border-radius:12px;padding:16px;margin:20px 0}img{max-width:100%;height:auto}</style><h1>RUUM-UX-006 · Opción B</h1><p>English deshabilitado con explicación previa; idioma efectivo español de México.</p><p><a href="DECISION-PRODUCTO.md">Decisión aprobada</a> · <a href="INFORME-CIERRE-RUUM-UX-006.md">Informe técnico</a> · <a href="resumen.json">Resultados estructurados</a></p><table><tr><th>Ancho</th><th>lang · preferencias / acceso</th><th>Fallos axe de nombre/idioma</th><th>503 / solicitudes posteriores exitosas</th><th>Idiomas enviados en preferencias generales</th></tr>${rows.map(r=>`<tr><td>${r.width}</td><td>${r.lang} / ${r.loginLang}</td><td>${r.violations.length}</td><td>${r.failedAttempts} / ${r.successfulAttempts}</td><td>${r.generalLanguages.join(', ')}</td></tr>`).join('')}</table><p>Los datos y los servicios son fixtures locales. Los reportes originales conservan las solicitudes y los resultados de axe; las pruebas de recarga, cambio de cuenta, 503 y reintento se detallan en el informe.</p>${cards.map(c=>`<details><summary>${c.label}</summary><a href="${c.file}"><img loading="lazy" src="${c.file}" alt="${c.label}"></a></details>`).join('')}</html>`);
console.log(JSON.stringify(rows.map(r=>({width:r.width,lang:r.lang,violations:r.violations.length,failedAttempts:r.failedAttempts,successfulAttempts:r.successfulAttempts,languages:r.generalLanguages})),null,2));
if(rows.some(r=>r.violations.length||r.lang!=='es-MX'||r.loginLang!=='es-MX'||!r.failedAttempts||!r.successfulAttempts||r.generalLanguages.some(l=>l!=='es')))process.exitCode=1;
