// AUREA fixes.js — version final
(function() {
'use strict';

var WA_NUMBER = '573213292637';
var TG_USER   = 'AUREAPulseras';

// ── FLOWS ─────────────────────────────────────────────────────────────────
window.FLOWS = {
  start: {
    msg: 'Hola! Bienvenida a *AUREA Pulseras*\n\nSoy tu asistente. En que te puedo ayudar?',
    qr: ['Ver coleccion', 'Precios', 'Personalizar grabado', 'Hacer un pedido']
  },
  precios: {
    msg: 'Nuestros precios:\n\nPlata 925 - $89.000\nAcero inoxidable - $60.000\nChapa oro 18K - $500.000\n\nEl grabado tiene costo adicional segun el material.',
    qr: ['Cuanto cuesta el grabado?', 'Hacer un pedido', 'Ver coleccion']
  },
  personalizar: {
    msg: 'Grabado personalizado:\n\nPuedes grabar tu nombre, una fecha o una frase en el dije.\n\nEl grabado es permanente, no se borra con el agua ni el uso.',
    qr: ['Precios', 'Hacer un pedido', 'Hablar con nosotros']
  },
  pedido: {
    msg: 'Para hacer tu pedido:\n\n1. Elige tu pulsera en la coleccion\n2. Agregala al carrito\n3. Completa tus datos\n\nO prefieres que te ayudemos a elegir?',
    qr: ['Ver coleccion', 'Precios', 'Hablar con nosotros']
  },
  envio: {
    msg: 'Envios a toda Colombia:\n\nYopal: mismo dia o siguiente\nResto del pais: 3 a 5 dias habiles\nEnviamos con numero de guia para rastrear',
    qr: ['Hacer un pedido', 'Precios', 'Ver coleccion']
  },
  sets: {
    msg: 'Sets de pareja:\n\nSet Alma - Plata 925 x2 - $160.000\nSet Aurora - Plata + Acero x2 - $130.000\n\nCada pulsera puede llevar grabado diferente. Incluye caja de regalo doble.',
    qr: ['Hacer un pedido', 'Precios', 'Hablar con nosotros']
  },
  humano: {
    msg: 'Te conectamos con nuestro equipo ahora mismo.',
    qr: ['Continuar por WhatsApp', 'Continuar por Telegram']
  },
  default: {
    msg: 'No encontre una respuesta para eso. Te ayudo con alguna de estas opciones?',
    qr: ['Precios', 'Hacer un pedido', 'Personalizar grabado', 'Hablar con nosotros']
  }
};

// ── detectFlow ─────────────────────────────────────────────────────────────
window.detectFlow = function(txt) {
  var t = (txt||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  if (t.indexOf('set')>-1||t.indexOf('pareja')>-1||t.indexOf('alma')>-1||t.indexOf('aurora')>-1) return FLOWS.sets;
  if (t.indexOf('grab')>-1||t.indexOf('dije')>-1||t.indexOf('personal')>-1||t.indexOf('nombre')>-1) return FLOWS.personalizar;
  if (t.indexOf('precio')>-1||t.indexOf('costo')>-1||t.indexOf('cuanto')>-1||t.indexOf('vale')>-1||t.indexOf('plata')>-1||t.indexOf('acero')>-1||t.indexOf('oro')>-1) return FLOWS.precios;
  if (t.indexOf('envio')>-1||t.indexOf('entrega')>-1||t.indexOf('demora')>-1||t.indexOf('llega')>-1||t.indexOf('tiempo')>-1) return FLOWS.envio;
  if (t.indexOf('pedido')>-1||t.indexOf('comprar')>-1||t.indexOf('quiero')>-1||t.indexOf('pulsera')>-1) return FLOWS.pedido;
  if (t.indexOf('person')>-1||t.indexOf('humano')>-1||t.indexOf('hablar')>-1||t.indexOf('asesor')>-1) return FLOWS.humano;
  if (t.indexOf('hola')>-1||t.indexOf('buenas')>-1||t.indexOf('inicio')>-1||t.indexOf('menu')>-1) return FLOWS.start;
  return null;
};

// ── Parchear sendWa para acciones especiales ───────────────────────────────
var _origSendWa = null;
function patchSendWa() {
  _origSendWa = window.sendWa;
  window.sendWa = function() {
    var inp = document.getElementById('wa-inp');
    if (!inp) return;
    var txt = inp.value.trim();
    var low = (txt||'').toLowerCase();
    if (low.indexOf('continuar por whatsapp')>-1) {
      inp.value='';
      if(typeof addWaMsg==='function') addWaMsg(txt,true);
      var ctx=buildCtx(window.waMsgHistory||[],'Web');
      setTimeout(function(){window.open('https://wa.me/'+WA_NUMBER+'?text='+encodeURIComponent(ctx),'_blank','noopener');},300);
      return;
    }
    if (low.indexOf('continuar por telegram')>-1) {
      inp.value='';
      if(typeof addWaMsg==='function') addWaMsg(txt,true);
      var ctx=buildCtx(window.waMsgHistory||[],'Web');
      setTimeout(function(){window.open('https://t.me/'+TG_USER+'?text='+encodeURIComponent(ctx),'_blank','noopener');},300);
      return;
    }
    if(typeof _origSendWa==='function') _origSendWa();
  };
  window.openWAWithContext = function(extra) {
    var ctx = extra||buildCtx(window.waMsgHistory||[],'Web');
    window.open('https://wa.me/'+WA_NUMBER+'?text='+encodeURIComponent(ctx),'_blank','noopener');
  };
}

function buildCtx(history, ch) {
  var lines=['Hola AUREA! Vengo del sitio web ('+ch+').'];
  (history||[]).forEach(function(m){
    if(m.user) lines.push('Yo: '+m.user);
    if(m.bot)  lines.push('Bot: '+m.bot.replace(/<[^>]+>/g,'').substring(0,80));
  });
  lines.push('Por favor continuen la atencion. Gracias!');
  return lines.join('\n');
}

// ── BOT TELEGRAM ──────────────────────────────────────────────────────────
var tgOpen=false, tgHist=[];

function injectTG() {
  var fab=document.getElementById('aurea-tg-fab');
  if(!fab) return;
  fab.onclick=function(e){e.stopPropagation();toggleTg();};
  if(document.getElementById('tg-panel')) return;

  var p=document.createElement('div');
  p.id='tg-panel';
  p.style.cssText='position:absolute;bottom:70px;right:0;width:min(350px,calc(100vw - 2rem));background:#17212B;border:.5px solid rgba(42,171,238,.25);border-radius:14px;overflow:hidden;display:none;flex-direction:column;box-shadow:0 12px 48px rgba(0,0,0,.55);z-index:460;';
  p.innerHTML=
    '<div style="background:linear-gradient(135deg,#0d2137,#17212B);padding:1rem 1.2rem;display:flex;align-items:center;gap:.9rem;">'
    +'<div style="width:40px;height:40px;border-radius:50%;background:#2AABEE;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M11.944 0A12 12 0 1 0 12 24a12 12 0 0 0-.056-24zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg></div>'
    +'<div style="flex:1;"><div style="font-size:.88rem;font-weight:500;color:white;">AUREA Pulseras</div><div style="font-size:.68rem;color:rgba(255,255,255,.5);margin-top:.1rem;display:flex;align-items:center;gap:.3rem;"><span style="width:6px;height:6px;border-radius:50%;background:#2AABEE;display:inline-block;"></span>Asistente Telegram</div></div>'
    +'<button onclick="toggleTg()" style="background:none;border:none;color:rgba(255,255,255,.5);font-size:1rem;cursor:pointer;padding:.3rem;line-height:1;">x</button>'
    +'</div>'
    +'<div id="tg-msgs" style="flex:1;padding:1rem;background:#0E1621;overflow-y:auto;max-height:280px;display:flex;flex-direction:column;gap:.7rem;"></div>'
    +'<div id="tg-qr" style="display:flex;flex-wrap:wrap;gap:.4rem;padding:.5rem 1rem;background:#0E1621;"></div>'
    +'<div style="display:flex;align-items:center;gap:.5rem;padding:.75rem 1rem;background:#17212B;border-top:.5px solid rgba(255,255,255,.05);">'
    +'<input id="tg-inp" placeholder="Escribe un mensaje..." style="flex:1;background:#242F3D;border:none;color:white;padding:.46rem .8rem;border-radius:22px;font-size:.76rem;font-family:DM Sans,sans-serif;outline:none;" onkeydown="if(event.key===\'Enter\')tgSend()">'
    +'<button onclick="tgSend()" style="width:34px;height:34px;background:#2AABEE;border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M2 21l21-9-21-9v7l15 2-15 2z"/></svg></button>'
    +'</div>';

  var stack=document.querySelector('.aurea-fab-stack')||document.querySelector('.wa-widget');
  if(stack) stack.appendChild(p);
}

window.toggleTg=function(){
  tgOpen=!tgOpen;
  var p=document.getElementById('tg-panel');
  if(!p) return;
  p.style.display=tgOpen?'flex':'none';
  p.style.flexDirection='column';
  var b=document.getElementById('aurea-tg-badge');
  if(b) b.style.display='none';
  if(tgOpen&&document.getElementById('tg-msgs').children.length===0){
    setTimeout(function(){tgAdd(FLOWS.start.msg,false);tgQRset(FLOWS.start.qr);},400);
  }
};

window.tgSend=function(){
  var inp=document.getElementById('tg-inp');
  if(!inp) return;
  var txt=inp.value.trim();
  if(!txt) return;
  inp.value='';
  tgAdd(txt,true);
  document.getElementById('tg-qr').innerHTML='';
  var low=(txt||'').toLowerCase();
  if(low.indexOf('continuar por whatsapp')>-1){
    window.open('https://wa.me/'+WA_NUMBER+'?text='+encodeURIComponent(buildCtx(tgHist,'Telegram')),'_blank','noopener');
    tgAdd('Te redirigimos a WhatsApp. Hasta pronto!',false); return;
  }
  if(low.indexOf('continuar por telegram')>-1){
    window.open('https://t.me/'+TG_USER+'?text='+encodeURIComponent(buildCtx(tgHist,'Telegram')),'_blank','noopener');
    tgAdd('Abriendo Telegram con el historial. Hasta pronto!',false); return;
  }
  tgTyp(true);
  setTimeout(function(){
    tgTyp(false);
    var f=detectFlow(txt)||FLOWS.default;
    tgAdd(f.msg,false);
    if(f.qr) tgQRset(f.qr);
    tgHist.push({user:txt,bot:f.msg});
  },750);
};

window.tgQR=function(btn){
  var inp=document.getElementById('tg-inp');
  if(inp) inp.value=btn.textContent.trim();
  tgSend();
};

function tgAdd(txt,isUser){
  var c=document.getElementById('tg-msgs');
  if(!c) return;
  var d=document.createElement('div');
  var time=new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'});
  d.style.cssText='max-width:85%;padding:.6rem .9rem;border-radius:10px;font-size:.77rem;line-height:1.55;word-break:break-word;'
    +(isUser?'background:#2B5278;color:white;align-self:flex-end;border-bottom-right-radius:3px;'
            :'background:#17212B;color:#ddd;align-self:flex-start;border-bottom-left-radius:3px;border:.5px solid rgba(42,171,238,.12);');
  d.innerHTML=txt.replace(/\*(.+?)\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>')
    +'<div style="font-size:.56rem;color:rgba(255,255,255,.3);margin-top:.25rem;text-align:right;">'+time+'</div>';
  c.appendChild(d); c.scrollTop=c.scrollHeight;
}

function tgTyp(show){
  var c=document.getElementById('tg-msgs');
  if(!c) return;
  var ex=document.getElementById('tg-typing');
  if(!show){if(ex)ex.remove();return;}
  if(ex) return;
  var d=document.createElement('div');
  d.id='tg-typing';
  d.style.cssText='background:#17212B;align-self:flex-start;border-radius:10px;padding:.65rem 1rem;border:.5px solid rgba(42,171,238,.1);';
  d.innerHTML='<div style="display:flex;gap:.3rem;">'
    +'<span style="width:5px;height:5px;border-radius:50%;background:#888;animation:dotb .8s ease-in-out infinite;display:inline-block;"></span>'
    +'<span style="width:5px;height:5px;border-radius:50%;background:#888;animation:dotb .8s .15s ease-in-out infinite;display:inline-block;"></span>'
    +'<span style="width:5px;height:5px;border-radius:50%;background:#888;animation:dotb .8s .3s ease-in-out infinite;display:inline-block;"></span>'
    +'</div>';
  c.appendChild(d); c.scrollTop=c.scrollHeight;
}

function tgQRset(arr){
  var el=document.getElementById('tg-qr');
  if(!el||!arr) return;
  el.innerHTML=arr.map(function(q){
    return '<button onclick="tgQR(this)" style="background:transparent;border:.5px solid rgba(42,171,238,.4);color:#2AABEE;padding:.25rem .65rem;border-radius:14px;font-size:.66rem;cursor:pointer;font-family:DM Sans,sans-serif;white-space:nowrap;" onmouseover="this.style.background=\'rgba(42,171,238,.1)\'" onmouseout="this.style.background=\'transparent\'">'+q+'</button>';
  }).join('');
}

// ── LOGIN DUPLICADO ────────────────────────────────────────────────────────
function fixLogin(){
  setTimeout(function(){
    ['nav-login-btn','nav-user-menu'].forEach(function(id){
      var els=document.querySelectorAll('#'+id);
      for(var i=1;i<els.length;i++) els[i].remove();
    });
  },1000);
}

// ── TRADUCTOR ──────────────────────────────────────────────────────────────
function fixTranslator(){
  var orig=window.changeLang;
  if(typeof orig==='function'){
    window.changeLang=function(code){
      orig(code);
      setTimeout(function(){
        document.querySelectorAll('[data-i18n]').forEach(function(el){
          var key=el.getAttribute('data-i18n');
          if(typeof window.t==='function'){
            var val=window.t(key,null);
            if(val&&val!==key) el.textContent=val;
          }
        });
      },250);
    };
  }
}

// ── ADMIN PIN ──────────────────────────────────────────────────────────────
function fixAdmin(){
  console.log('%c Admin PIN: 2024','color:#C9A84C;font-size:14px;font-weight:bold;');
}

// ── INIT ───────────────────────────────────────────────────────────────────
function init(){
  patchSendWa();
  injectTG();
  fixLogin();
  fixTranslator();
  fixAdmin();
  console.log('%c AUREA fixes.js cargado','color:#C9A84C;');
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
} else {
  init();
}

})();

// ── SIMULADORES ADMIN ─────────────────────────────────────────────────────
window.switchSim = function(ch) {
  var waC = document.getElementById('sim-wa-console');
  var tgC = document.getElementById('sim-tg-console');
  var waB = document.getElementById('sim-wa-btn');
  var tgB = document.getElementById('sim-tg-btn');
  if (ch === 'wa') {
    if(waC) waC.style.display='';
    if(tgC) tgC.style.display='none';
    if(waB) {waB.style.background='#25D366';waB.style.color='white';waB.style.border='none';}
    if(tgB) {tgB.style.background='transparent';tgB.style.color='var(--gray2)';tgB.style.border='.5px solid rgba(255,255,255,.15)';}
  } else {
    if(waC) waC.style.display='none';
    if(tgC) tgC.style.display='';
    if(tgB) {tgB.style.background='#2AABEE';tgB.style.color='white';tgB.style.border='none';}
    if(waB) {waB.style.background='transparent';waB.style.color='var(--gray2)';waB.style.border='.5px solid rgba(255,255,255,.15)';}
    // Init TG sim if empty
    var msgs = document.getElementById('bc-tg-msgs');
    if(msgs && msgs.children.length === 0) {
      bcTgAddMsg(FLOWS.start.msg, false);
      bcTgSetQR(FLOWS.start.qr);
    }
  }
};

window.bcTgSend = function() {
  var inp = document.getElementById('bc-tg-inp');
  if(!inp) return;
  var txt = inp.value.trim();
  if(!txt) return;
  inp.value = '';
  bcTgAddMsg(txt, true);
  var qr = document.getElementById('bc-tg-qr');
  if(qr) qr.innerHTML = '';
  setTimeout(function() {
    var flow = detectFlow(txt) || FLOWS.default;
    bcTgAddMsg(flow.msg, false);
    if(flow.qr) bcTgSetQR(flow.qr);
  }, 600);
};

window.bcTgClear = function() {
  var c = document.getElementById('bc-tg-msgs');
  if(c) c.innerHTML = '';
  bcTgAddMsg(FLOWS.start.msg, false);
  bcTgSetQR(FLOWS.start.qr);
};

window.bcTgQR = function(btn) {
  var inp = document.getElementById('bc-tg-inp');
  if(inp) inp.value = btn.textContent.trim();
  bcTgSend();
};

function bcTgAddMsg(txt, isUser) {
  var c = document.getElementById('bc-tg-msgs');
  if(!c) return;
  var d = document.createElement('div');
  d.className = 'wm ' + (isUser?'user':'bot');
  d.style.cssText = 'max-width:85%;padding:.55rem .85rem;border-radius:10px;font-size:.76rem;line-height:1.5;'
    + (isUser ? 'background:#2B5278;color:white;align-self:flex-end;border-bottom-right-radius:3px;'
               : 'background:#17212B;color:#ddd;align-self:flex-start;border-bottom-left-radius:3px;border:.5px solid rgba(42,171,238,.15);');
  d.innerHTML = txt.replace(/\*(.+?)\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
  c.appendChild(d); c.scrollTop = c.scrollHeight;
}

function bcTgSetQR(arr) {
  // Inject QR below msgs
  var c = document.getElementById('bc-tg-msgs');
  if(!c || !arr) return;
  var old = document.getElementById('bc-tg-qr-wrap');
  if(old) old.remove();
  var d = document.createElement('div');
  d.id = 'bc-tg-qr-wrap';
  d.style.cssText = 'display:flex;flex-wrap:wrap;gap:.35rem;padding:.4rem .5rem;background:#0E1621;';
  d.innerHTML = arr.map(function(q){
    return '<button onclick="bcTgQR(this)" style="background:transparent;border:.5px solid rgba(42,171,238,.4);color:#2AABEE;padding:.25rem .65rem;border-radius:14px;font-size:.66rem;cursor:pointer;font-family:DM Sans,sans-serif;transition:all .2s;" onmouseover="this.style.background=\'rgba(42,171,238,.1)\'" onmouseout="this.style.background=\'transparent\'">'+q+'</button>';
  }).join('');
  var parent = c.parentElement;
  if(parent) parent.insertBefore(d, c.nextSibling);
}

// Patch bcSend to use FLOWS
var _origBcSend = window.bcSend;
window.bcSend = function() {
  var inp = document.getElementById('bc-inp');
  if(!inp) return;
  var txt = inp.value.trim();
  if(!txt) return;
  inp.value = '';
  bcAddMsg(txt, true);
  var c = document.getElementById('bc-msgs');
  var oldQr = c ? c.querySelector('.bc-qr-wrap') : null;
  if(oldQr) oldQr.remove();
  setTimeout(function() {
    var flow = detectFlow(txt) || FLOWS.default;
    bcAddMsg(flow.msg, false);
    if(flow.qr) {
      var d = document.createElement('div');
      d.className = 'bc-qr-wrap';
      d.style.cssText = 'display:flex;flex-wrap:wrap;gap:.35rem;margin:.3rem 0 .4rem;padding:0 .5rem;';
      d.innerHTML = flow.qr.map(function(q){
        return '<button onclick="bcQR(this)" style="background:transparent;border:.5px solid rgba(37,211,102,.4);color:#25D366;padding:.25rem .65rem;border-radius:14px;font-size:.66rem;cursor:pointer;font-family:DM Sans,sans-serif;" onmouseover="this.style.background=\'rgba(37,211,102,.1)\'" onmouseout="this.style.background=\'transparent\'">'+q+'</button>';
      }).join('');
      if(c) { c.appendChild(d); c.scrollTop = c.scrollHeight; }
    }
  }, 600);
};
