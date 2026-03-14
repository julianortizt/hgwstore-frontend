/**
 * PanelVendedor.jsx — Panel de vendedor HGW Store
 */
import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const VERDE = '#2d5016';

export default function PanelVendedor({ token, usuario, onCerrarSesion }) {
  const [seccion, setSeccion] = useState('estadisticas');
  const [stats, setStats]     = useState(null);
  const [cargando, setCargando] = useState(false);
  const [msg, setMsg]           = useState('');

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const mostrarMsg = (texto, ok = true) => {
    setMsg({ texto, ok });
    setTimeout(() => setMsg(''), 3000);
  };

  useEffect(() => { cargarDatos(); }, [seccion]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      if (seccion === 'estadisticas') {
        const r = await fetch(`${API_URL}/api/admin/estadisticas`, { headers });
        const d = await r.json();
        setStats(d.estadisticas);
      }
    } catch (e) {
      mostrarMsg('Error cargando datos', false);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div style={{ background: VERDE, color: 'white', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>💼 HGW Store — Mi Panel</div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', opacity: 0.9 }}>👋 {usuario?.nombre}</span>
          <button onClick={onCerrarSesion} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderBottom: '2px solid #e5e7eb', display: 'flex', gap: '4px', padding: '0 24px' }}>
        {[
          { id: 'estadisticas', label: '📊 Mis Ventas' },
          { id: 'pedido',       label: '🛒 Realizar Pedido' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setSeccion(tab.id)}
            style={{
              padding: '12px 18px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500',
              background: 'transparent',
              color: seccion === tab.id ? VERDE : '#666',
              borderBottom: seccion === tab.id ? `3px solid ${VERDE}` : '3px solid transparent',
            }}
          >{tab.label}</button>
        ))}
      </div>

      {msg && (
        <div style={{ margin: '12px 24px 0', padding: '10px 16px', borderRadius: '8px', background: msg.ok ? '#ecfdf5' : '#fef2f2', color: msg.ok ? VERDE : '#dc2626', fontWeight: '500', fontSize: '14px' }}>
          {msg.texto}
        </div>
      )}

      <div style={{ padding: '24px' }}>
        {/* Estadísticas */}
        {seccion === 'estadisticas' && (
          <div>
            <h2 style={{ color: VERDE, marginTop: 0 }}>Mis Ventas</h2>
            {cargando ? <p>Cargando...</p> : stats ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                  {[
                    { label: 'Mis Pedidos',  value: stats.total_pedidos,   icon: '🛒' },
                    { label: 'Mis Ventas',   value: `$${stats.total_ventas?.toLocaleString()} COP`, icon: '💰' },
                  ].map((item, i) => (
                    <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: `4px solid ${VERDE}` }}>
                      <div style={{ fontSize: '28px' }}>{item.icon}</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: VERDE }}>{item.value}</div>
                      <div style={{ fontSize: '13px', color: '#666' }}>{item.label}</div>
                    </div>
                  ))}
                </div>

                <h3 style={{ color: VERDE }}>Últimos Pedidos</h3>
                <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: VERDE, color: 'white' }}>
                        {['Factura', 'Cliente', 'Total', 'Método', 'Fecha'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.ultimos_pedidos?.length > 0 ? stats.ultimos_pedidos.map((p, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                          <td style={{ padding: '10px 14px', fontWeight: '500' }}>{p.numero_factura}</td>
                          <td style={{ padding: '10px 14px' }}>{p.cliente_nombre}</td>
                          <td style={{ padding: '10px 14px', color: VERDE, fontWeight: 'bold' }}>${p.total?.toLocaleString()}</td>
                          <td style={{ padding: '10px 14px' }}>{p.metodo_pago}</td>
                          <td style={{ padding: '10px 14px', color: '#888' }}>{new Date(p.fecha_creacion).toLocaleDateString('es-CO')}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No hay pedidos aún</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : <p>No se pudieron cargar las estadísticas.</p>}
          </div>
        )}

        {/* Realizar Pedido */}
        {seccion === 'pedido' && (
          <div>
            <h2 style={{ color: VERDE, marginTop: 0 }}>🛒 Realizar Pedido</h2>
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <p style={{ color: '#666' }}>Esta funcionalidad estará disponible próximamente. Por ahora puedes registrar ventas desde la tienda principal.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
