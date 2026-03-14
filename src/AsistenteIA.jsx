/**
 * AsistenteIA.jsx — Asistente VERA
 * Apariencia: botón rectangular estilo original HGW
 * Lógica: lista oficial 36 dolencias + descarga guía
 */

import React, { useState, useRef, useEffect } from 'react';

const ADMIN_WHATSAPP = '573001234567';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DOLENCIAS_HGW = {
  'Sistema Inmunológico': {
    emoji: '🛡️',
    dolencias: {
      'Defensas bajas':                     ['Ganoderma Coffee', 'Espirulina', 'Lactiberry'],
      'Resfriados frecuentes':              ['Ganoderma Coffee', 'Espirulina', 'Omega 3-6-9'],
      'Infecciones recurrentes':            ['Ganoderma Coffee', 'Espirulina', 'Lactiberry'],
      'Debilidad del sistema inmunológico': ['Ganoderma Coffee', 'Espirulina', 'Omega 3-6-9', 'Cordyceps Sinensis'],
    },
  },
  'Energía y Rendimiento': {
    emoji: '⚡',
    dolencias: {
      'Fatiga crónica':          ['Ganoderma Coffee', 'Cordyceps Sinensis', 'Espirulina'],
      'Cansancio físico':        ['Ganoderma Coffee', 'Berry Coffee', 'Blueberry Soy Protein'],
      'Falta de energía':        ['Ganoderma Coffee', 'Berry Coffee', 'Cordyceps Sinensis', 'Espirulina'],
      'Bajo rendimiento físico': ['Cordyceps Sinensis', 'Blueberry Soy Protein', 'Omega 3-6-9'],
      'Bajo rendimiento mental': ['Ganoderma Coffee', 'Omega 3-6-9', 'Berry Coffee'],
    },
  },
  'Sistema Digestivo': {
    emoji: '🫁',
    dolencias: {
      'Estreñimiento':                     ['Lactiberry', 'Pro-Shaping Tea'],
      'Digestión lenta':                   ['Lactiberry', 'Pro-Shaping Tea', 'Ganoderma Coffee'],
      'Inflamación abdominal':             ['Pro-Shaping Tea', 'Lactiberry', 'Omega 3-6-9'],
      'Gastritis leve':                    ['Lactiberry', 'Ganoderma Coffee'],
      'Acidez estomacal':                  ['Lactiberry', 'Waterson'],
      'Desbalance de la flora intestinal': ['Lactiberry'],
    },
  },
  'Sistema Cardiovascular': {
    emoji: '❤️',
    dolencias: {
      'Colesterol alto':          ['Omega 3-6-9', 'Ganoderma Coffee', 'Pro-Shaping Tea'],
      'Triglicéridos elevados':   ['Omega 3-6-9', 'Pro-Shaping Tea'],
      'Mala circulación':         ['Omega 3-6-9', 'Collar de Turmalina', 'Berry Coffee'],
      'Presión arterial elevada': ['Omega 3-6-9', 'Ganoderma Coffee'],
      'Riesgo cardiovascular':    ['Omega 3-6-9', 'Ganoderma Coffee', 'Espirulina'],
    },
  },
  'Metabolismo': {
    emoji: '⚖️',
    dolencias: {
      'Sobrepeso':              ['Pro-Shaping Tea', 'Blueberry Soy Protein', 'Lactiberry'],
      'Metabolismo lento':      ['Pro-Shaping Tea', 'Ganoderma Coffee', 'Espirulina'],
      'Acumulación de toxinas': ['Pro-Shaping Tea', 'Espirulina', 'Waterson'],
    },
  },
  'Sistema Urinario': {
    emoji: '💧',
    dolencias: {
      'Infecciones urinarias recurrentes': ['Lactiberry', 'Waterson', 'Toallas Sanitarias'],
      'Molestias urinarias':               ['Cordyceps Sinensis', 'Waterson'],
      'Problemas de vejiga':               ['Cordyceps Sinensis', 'Waterson'],
    },
  },
  'Sistema Nervioso': {
    emoji: '🧠',
    dolencias: {
      'Estrés':                     ['Ganoderma Coffee', 'Cordyceps Sinensis', 'Collar de Turmalina'],
      'Ansiedad leve':              ['Ganoderma Coffee', 'Omega 3-6-9', 'Collar de Turmalina'],
      'Problemas de concentración': ['Ganoderma Coffee', 'Omega 3-6-9', 'Berry Coffee'],
      'Insomnio':                   ['Ganoderma Coffee', 'Collar de Turmalina', 'Omega 3-6-9'],
    },
  },
  'Sistema Musculoesquelético': {
    emoji: '🦴',
    dolencias: {
      'Dolor articular':           ['Omega 3-6-9', 'Collar de Turmalina', 'Blueberry Colafruit'],
      'Rigidez en articulaciones': ['Omega 3-6-9', 'Blueberry Colafruit', 'Collar de Turmalina'],
      'Debilidad muscular':        ['Blueberry Soy Protein', 'Cordyceps Sinensis', 'Espirulina'],
      'Desgaste de cartílago':     ['Blueberry Colafruit', 'Omega 3-6-9'],
    },
  },
  'Piel y Belleza': {
    emoji: '✨',
    dolencias: {
      'Piel seca':                       ['Olive Soap', 'Blueberry Essence', 'Blueberry Colafruit'],
      'Envejecimiento prematuro':        ['Blueberry Essence', 'Blueberry Colafruit', 'Espirulina'],
      'Falta de elasticidad de la piel': ['Blueberry Colafruit', 'Blueberry Essence', 'Tourmaline Soap'],
      'Manchas en la piel':              ['Blueberry Essence', 'Tourmaline Soap', 'Espirulina'],
    },
  },
  'Antioxidantes y Envejecimiento': {
    emoji: '🌿',
    dolencias: {
      'Estrés oxidativo':       ['Espirulina', 'Berry Coffee', 'Blueberry Candy', 'Blueberry Colafruit'],
      'Inflamación general':    ['Omega 3-6-9', 'Ganoderma Coffee', 'Espirulina'],
      'Envejecimiento celular': ['Blueberry Colafruit', 'Berry Coffee', 'Blueberry Essence', 'Espirulina'],
    },
  },
  'Bienestar General': {
    emoji: '💪',
    dolencias: {
      'Falta de vitalidad':                      ['Ganoderma Coffee', 'Cordyceps Sinensis', 'Espirulina'],
      'Problemas de detoxificación':             ['Pro-Shaping Tea', 'Espirulina', 'Waterson'],
      'Debilidad general':                       ['Espirulina', 'Ganoderma Coffee', 'Blueberry Soy Protein'],
      'Recuperación lenta después de ejercicio': ['Blueberry Soy Protein', 'Cordyceps Sinensis', 'Omega 3-6-9'],
    },
  },
};

const DOLENCIAS_TEXTO = Object.entries(DOLENCIAS_HGW)
  .map(([sistema, { emoji, dolencias }]) =>
    `${emoji} ${sistema}:\n` +
    Object.entries(dolencias)
      .map(([d, prods]) => `  - ${d} → ${prods.join(', ')}`)
      .join('\n')
  ).join('\n\n');

const CHIPS_RAPIDOS = [
  '🛡️ Defensas bajas',
  '⚡ Cansancio o fatiga',
  '⚖️ Quiero bajar de peso',
  '❤️ Colesterol alto',
  '🧠 Estrés o ansiedad',
  '🦴 Dolor articular',
  '✨ Cuidado de la piel',
  '📋 Ver todos los productos',
];

export default function AsistenteIA({ productos = [], configCliente = {}, onAgregarAlCarrito }) {
  const [abierto,     setAbierto]     = useState(false);
  const [mensajes,    setMensajes]    = useState([
    {
      rol: 'asistente',
      texto: '¡Hola! Soy VERA, tu asistente virtual de HGW Store. 🌿\n\nCuéntame cómo te sientes y te recomiendo el producto ideal según tu caso.\n\n¿O prefieres explorar por área de salud?',
      timestamp: new Date(),
      chips: true,
    }
  ]);
  const [input,       setInput]       = useState('');
  const [cargando,    setCargando]    = useState(false);
  const [notifAdmin,  setNotifAdmin]  = useState(false);
  const [descargando, setDescargando] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  useEffect(() => {
    if (abierto && inputRef.current) setTimeout(() => inputRef.current?.focus(), 100);
  }, [abierto]);

  // ── COLOR BASE (igual que el App original: #2d5016) ──────────────────────
  const colorBase = configCliente?.colores?.primario || '#2d5016';
  const colorOscuro = '#2d5016';

  // ── GENERAR Y DESCARGAR GUÍA ──────────────────────────────────────────────
  const descargarGuia = () => {
    setDescargando(true);
    try {
      // Generar HTML para imprimir como PDF
      let html = `
        <html>
        <head>
          <meta charset="utf-8">
          <title>Guía de Beneficios HGW Store</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #222; }
            h1 { color: #2d5016; text-align: center; border-bottom: 3px solid #2d5016; padding-bottom: 10px; }
            h2 { color: #2d5016; margin-top: 24px; background: #e8f5e9; padding: 8px 12px; border-radius: 6px; }
            h3 { color: #1b5e20; margin-top: 16px; }
            .producto { background: #f9f9f9; padding: 8px 12px; border-left: 3px solid #2d5016; margin: 6px 0; border-radius: 4px; }
            .dolencia { margin: 4px 0; padding: 4px 8px; }
            .prods { color: #2d5016; font-weight: bold; }
            .nota { background: #fff8e1; padding: 10px; border-radius: 6px; font-size: 12px; margin-bottom: 20px; }
            .catalogo-item { border-bottom: 1px solid #eee; padding: 8px 0; }
            @media print { body { padding: 15px; } }
          </style>
        </head>
        <body>
          <h1>🌿 HGW Store — Guía de Beneficios</h1>
          <p style="text-align:center; color:#666;">Health, Growth & Wellness</p>
          <div class="nota">⚠️ Estos productos son naturales y complementan un estilo de vida saludable. No reemplazan tratamientos médicos.</div>
      `;

      Object.entries(DOLENCIAS_HGW).forEach(([sistema, { emoji, dolencias }]) => {
        html += `<h2>${emoji} ${sistema}</h2>`;
        Object.entries(dolencias).forEach(([dolencia, prods]) => {
          html += `<div class="dolencia">• <strong>${dolencia}</strong><br><span class="prods">→ ${prods.join(', ')}</span></div>`;
        });
      });

      if (productos.length > 0) {
        html += `<h2>📦 Catálogo de Productos</h2>`;
        productos.forEach(p => {
          html += `<div class="catalogo-item"><strong>${p.nombre}</strong> — <span style="color:#2d5016">$${p.precio?.toLocaleString()} COP</span>`;
          if (p.descripcion) html += `<br><small>${p.descripcion}</small>`;
          html += `</div>`;
        });
      }

      html += `<p style="text-align:center; margin-top:30px; color:#888; font-size:12px;">¡Gracias por confiar en HGW Store!</p></body></html>`;

      const ventana = window.open('', '_blank');
      ventana.document.write(html);
      ventana.document.close();
      ventana.focus();
      setTimeout(() => { ventana.print(); ventana.close(); }, 500);

      setMensajes(prev => [...prev, {
        rol: 'asistente',
        texto: '📄 ¡Listo! Se abrió la guía para guardar como PDF. En el diálogo de impresión selecciona "Guardar como PDF". 🌿',
        timestamp: new Date(),
      }]);
    } catch (e) {
      setMensajes(prev => [...prev, {
        rol: 'asistente',
        texto: '⚠️ No pude generar el archivo. Intenta de nuevo.',
        timestamp: new Date(),
      }]);
    } finally {
      setDescargando(false);
    }
  };

  // ── NOTIFICAR ADMIN ────────────────────────────────────────────────────────
  const notificarAdmin = (datosVenta) => {
    const texto = encodeURIComponent(
      `🛒 *NUEVA VENTA - ${configCliente.nombre || 'HGW Store'}*\n\n` +
      `👤 Cliente: ${datosVenta.cliente || 'No especificado'}\n` +
      `📦 Productos: ${datosVenta.productos || 'Ver sistema'}\n` +
      `💰 Total: ${datosVenta.total || 'Ver sistema'}\n` +
      `📅 ${new Date().toLocaleString('es-CO')}\n_Asistente VERA_`
    );
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${texto}`, '_blank');
    setNotifAdmin(true);
    setTimeout(() => setNotifAdmin(false), 4000);
  };

  // ── LLAMAR A CLAUDE ───────────────────────────────────────────────────────
  const llamarClaude = async (historialMensajes) => {
    const historial = historialMensajes
      .filter(m => m.rol !== 'sistema')
      .map(m => ({
        role: m.rol === 'asistente' ? 'assistant' : 'user',
        content: m.texto,
      }));

    const response = await fetch(`${API_URL}/api/asistente/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ historial }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(`Error ${response.status}`);
    return data.respuesta || 'Lo siento, no pude procesar tu consulta. Intenta de nuevo.';
  };

  // ── ENVIAR MENSAJE ────────────────────────────────────────────────────────
  const enviarMensaje = async (textoForzado) => {
    const raw   = (textoForzado || input).trim();
    // Quitar emoji y espacios al inicio para los chips, conservar el resto
    const texto = raw.replace(/^[\s\S]*?([A-Za-záéíóúüñÁÉÍÓÚÜÑ].*)$/, '$1').trim() || raw;
    if (!texto || cargando) return;

    const nuevoUsuario   = { rol: 'usuario', texto, timestamp: new Date() };
    const nuevoHistorial = [...mensajes, nuevoUsuario];
    setMensajes(nuevoHistorial);
    setInput('');
    setCargando(true);

    try {
      const respuesta     = await llamarClaude(nuevoHistorial);
      const ventaMatch    = respuesta.match(/\[VENTA_DETECTADA:([^\]]+)\]/);
      let textoRespuesta  = respuesta.replace(/\[VENTA_DETECTADA:[^\]]+\]/g, '').trim();

      if (ventaMatch) {
        const partes = ventaMatch[1].split(':');
        notificarAdmin({
          cliente:   partes[0] || 'Cliente',
          productos: partes[1] || 'Productos',
          total:     partes[2] ? `$${parseInt(partes[2]).toLocaleString()} COP` : 'Ver sistema',
        });
        textoRespuesta += '\n\n✅ ¡Perfecto! He notificado a nuestro equipo. Pronto te contactarán.';
      }

      const mencionaProductos = productos.some(p => textoRespuesta.includes(p.nombre));

      setMensajes(prev => [...prev, {
        rol: 'asistente',
        texto: textoRespuesta,
        timestamp: new Date(),
        esVenta: !!ventaMatch,
        mostrarGuia: mencionaProductos,
      }]);
    } catch (error) {
      setMensajes(prev => [...prev, {
        rol: 'asistente',
        texto: '⚠️ Hubo un problema al conectar. Intenta de nuevo.',
        timestamp: new Date(),
      }]);
    } finally {
      setCargando(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje(); }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Notif admin WhatsApp */}
      {notifAdmin && (
        <div style={{
          position: 'fixed', bottom: '100px', right: '20px', zIndex: 10001,
          background: '#25D366', color: 'white', padding: '10px 16px',
          borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
          fontSize: '13px', fontWeight: '600',
        }}>
          ✅ Admin notificado por WhatsApp
        </div>
      )}

      {/* ── BOTÓN FLOTANTE — estilo original rectangular ── */}
      <div style={{ position: 'fixed', bottom: '100px', right: '20px', zIndex: 1000 }}>
        {!abierto ? (
          <button
            onClick={() => setAbierto(true)}
            style={{
              background: `linear-gradient(135deg, ${colorOscuro} 0%, #4a7c25 100%)`,
              color: 'white', border: 'none', padding: '12px 20px',
              borderRadius: '12px', fontSize: '14px', fontWeight: 'bold',
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            🤖 Asistente VERA
          </button>
        ) : (

          /* ── VENTANA DE CHAT — estilo original ── */
          <div style={{
            width: '350px', background: 'white', borderRadius: '15px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)', overflow: 'hidden',
          }}>

            {/* Header */}
            <div style={{
              background: colorOscuro, color: 'white', padding: '15px',
              fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>🤖 Asistente VERA</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* Botón descargar guía */}
                <button
                  onClick={descargarGuia}
                  disabled={descargando}
                  title="Descargar guía de beneficios"
                  style={{
                    background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
                    color: 'white', borderRadius: '8px', padding: '4px 8px',
                    cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                  }}
                >
                  {descargando ? '⏳' : '📄 Guía'}
                </button>
                <button
                  onClick={() => setAbierto(false)}
                  style={{
                    background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none',
                    borderRadius: '50%', width: '30px', height: '30px',
                    fontSize: '18px', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >×</button>
              </div>
            </div>

            {/* Mensajes */}
            <div style={{ height: '320px', overflowY: 'auto', padding: '15px', background: '#f9f9f9' }}>
              {mensajes.map((msg, i) => (
                <div key={i}>
                  <div style={{
                    marginBottom: '10px', padding: '10px', borderRadius: '10px',
                    background: msg.rol === 'usuario'
                      ? colorOscuro
                      : msg.esVenta ? '#ecfdf5' : 'white',
                    color: msg.rol === 'usuario' ? 'white' : 'black',
                    maxWidth: '85%',
                    marginLeft: msg.rol === 'usuario' ? 'auto' : '0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                    whiteSpace: 'pre-line', fontSize: '14px', lineHeight: '1.5',
                    border: msg.esVenta ? `1px solid ${colorOscuro}` : 'none',
                  }}>
                    {msg.texto}
                  </div>

                  {/* Chips acceso rápido */}
                  {msg.chips && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                      {CHIPS_RAPIDOS.map((chip, ci) => (
                        <button key={ci} onClick={() => enviarMensaje(chip)}
                          style={{
                            background: 'white', border: `1px solid ${colorOscuro}`,
                            color: colorOscuro, borderRadius: '20px',
                            padding: '3px 9px', fontSize: '11px',
                            cursor: 'pointer', fontWeight: '500',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = colorOscuro; e.currentTarget.style.color = 'white'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = colorOscuro; }}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Botón guía cuando VERA recomienda productos */}
                  {msg.mostrarGuia && msg.rol === 'asistente' && (
                    <div style={{ marginBottom: '8px' }}>
                      <button onClick={descargarGuia}
                        style={{
                          background: '#f0f7f0', border: `1px solid ${colorOscuro}`,
                          color: colorOscuro, borderRadius: '8px',
                          padding: '5px 10px', fontSize: '12px',
                          cursor: 'pointer', fontWeight: '600',
                        }}
                      >
                        📄 Descargar guía de beneficios
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Escribiendo... */}
              {cargando && (
                <div style={{ textAlign: 'left', color: '#999', marginBottom: '8px' }}>
                  <em>Escribiendo...</em>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '15px', borderTop: '1px solid #ddd', background: 'white' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={cargando}
                  placeholder="¿Cómo te sientes hoy?"
                  style={{
                    flex: 1, padding: '10px', border: '1px solid #ddd',
                    borderRadius: '8px', fontSize: '14px', outline: 'none',
                  }}
                />
                <button
                  onClick={() => enviarMensaje()}
                  disabled={cargando || !input.trim()}
                  style={{
                    background: cargando || !input.trim() ? '#ccc' : colorOscuro,
                    color: 'white', border: 'none', padding: '10px 16px',
                    borderRadius: '8px', cursor: cargando || !input.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '14px', fontWeight: 'bold',
                    opacity: cargando ? 0.6 : 1,
                  }}
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
