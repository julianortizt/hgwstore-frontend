/**
 * PanelAdmin.jsx — Panel de administración HGW Store
 * Funciones: gestión de productos, usuarios, pedidos, estadísticas
 */
import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const VERDE = '#2d5016';

const CATEGORIAS = [
  'Suplementos', 'Bebidas', 'Proteínas', 'Belleza',
  'Higiene', 'Accesorios', 'Infusiones', 'Otros'
];

const productoVacio = {
  nombre: '', descripcion: '', beneficios: '',
  categoria: 'Suplementos', imagen_url: '', precio: '', stock: '', cliente_id: 1
};

export default function PanelAdmin({ token, onCerrarSesion }) {
  const [seccion, setSeccion]       = useState('estadisticas');
  const [productos, setProductos]   = useState([]);
  const [usuarios, setUsuarios]     = useState([]);
  const [stats, setStats]           = useState(null);
  const [form, setForm]             = useState(productoVacio);
  const [editando, setEditando]     = useState(null);
  const [msg, setMsg]               = useState('');
  const [cargando, setCargando]     = useState(false);
  const [busqueda, setBusqueda]     = useState('');
  const [subiendo, setSubiendo]     = useState(false);

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
      if (seccion === 'productos') {
        const r = await fetch(`${API_URL}/api/productos?limit=200`, { headers });
        const d = await r.json();
        setProductos(d.productos || []);
      }
      if (seccion === 'usuarios') {
        const r = await fetch(`${API_URL}/api/admin/usuarios`, { headers });
        const d = await r.json();
        setUsuarios(d.usuarios || []);
      }
    } catch (e) {
      mostrarMsg('Error cargando datos', false);
    } finally {
      setCargando(false);
    }
  };

  const subirImagen = async (archivo) => {
    if (!archivo) return;
    setSubiendo(true);
    try {
      const fd = new FormData();
      fd.append('file', archivo);
      const r = await fetch(`${API_URL}/api/upload/imagen`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const d = await r.json();
      if (d.success) {
        setForm(prev => ({ ...prev, imagen_url: d.url }));
        mostrarMsg('Imagen subida ✅');
      } else {
        mostrarMsg('Error al subir imagen', false);
      }
    } catch (e) {
      mostrarMsg('Error de conexión', false);
    } finally {
      setSubiendo(false);
    }
  };

  const guardarProducto = async () => {
    if (!form.nombre || !form.precio) return mostrarMsg('Nombre y precio son obligatorios', false);
    setCargando(true);
    try {
      const url    = editando ? `${API_URL}/api/productos/${editando}` : `${API_URL}/api/productos`;
      const method = editando ? 'PUT' : 'POST';
      const r      = await fetch(url, { method, headers, body: JSON.stringify({ ...form, precio: parseFloat(form.precio), stock: parseInt(form.stock) || 0 }) });
      const d      = await r.json();
      if (d.success) {
        mostrarMsg(editando ? 'Producto actualizado ✅' : 'Producto creado ✅');
        setForm(productoVacio);
        setEditando(null);
        cargarDatos();
      } else {
        mostrarMsg(d.detail || 'Error al guardar', false);
      }
    } catch (e) {
      mostrarMsg('Error de conexión', false);
    } finally {
      setCargando(false);
    }
  };

  const eliminarProducto = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar "${nombre}"?`)) return;
    try {
      const r = await fetch(`${API_URL}/api/productos/${id}`, { method: 'DELETE', headers });
      const d = await r.json();
      if (d.success) { mostrarMsg('Producto eliminado'); cargarDatos(); }
      else mostrarMsg('Error al eliminar', false);
    } catch { mostrarMsg('Error de conexión', false); }
  };

  const editarProducto = (p) => {
    setForm({ ...p, precio: p.precio?.toString(), stock: p.stock?.toString() });
    setEditando(p.id);
    setSeccion('productos');
    window.scrollTo(0, 0);
  };

  const productosFiltrados = productos.filter(p =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const s = { fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#f5f5f5' };

  return (
    <div style={s}>
      {/* Header */}
      <div style={{ background: VERDE, color: 'white', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>🌿 HGW Store — Panel Admin</div>
        <button onClick={onCerrarSesion} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
          Cerrar sesión
        </button>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderBottom: '2px solid #e5e7eb', display: 'flex', gap: '4px', padding: '0 24px' }}>
        {[
          { id: 'estadisticas', label: '📊 Estadísticas' },
          { id: 'productos',    label: '📦 Productos' },
          { id: 'usuarios',     label: '👥 Usuarios' },
        ].map(tab => (
          <button key={tab.id} onClick={() => { setSeccion(tab.id); setEditando(null); setForm(productoVacio); }}
            style={{
              padding: '12px 18px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500',
              background: 'transparent',
              color: seccion === tab.id ? VERDE : '#666',
              borderBottom: seccion === tab.id ? `3px solid ${VERDE}` : '3px solid transparent',
            }}
          >{tab.label}</button>
        ))}
      </div>

      {/* Mensaje */}
      {msg && (
        <div style={{ margin: '12px 24px 0', padding: '10px 16px', borderRadius: '8px', background: msg.ok ? '#ecfdf5' : '#fef2f2', color: msg.ok ? VERDE : '#dc2626', fontWeight: '500', fontSize: '14px' }}>
          {msg.texto}
        </div>
      )}

      <div style={{ padding: '24px' }}>

        {/* ── ESTADÍSTICAS ── */}
        {seccion === 'estadisticas' && (
          <div>
            <h2 style={{ color: VERDE, marginTop: 0 }}>Resumen General</h2>
            {cargando ? <p>Cargando...</p> : stats ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                  {[
                    { label: 'Total Pedidos',   value: stats.total_pedidos,   icon: '🛒' },
                    { label: 'Total Ventas',     value: `$${stats.total_ventas?.toLocaleString()} COP`, icon: '💰' },
                    { label: 'Usuarios',         value: stats.total_usuarios,  icon: '👥' },
                    { label: 'Vendedores',       value: stats.total_vendedores,icon: '🧑‍💼' },
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

        {/* ── PRODUCTOS ── */}
        {seccion === 'productos' && (
          <div>
            {/* Formulario */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <h3 style={{ color: VERDE, marginTop: 0 }}>{editando ? '✏️ Editar Producto' : '➕ Nuevo Producto'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {[
                  { key: 'nombre',  label: 'Nombre *',       type: 'text' },
                  { key: 'precio',  label: 'Precio (COP) *', type: 'number' },
                  { key: 'stock',   label: 'Stock',          type: 'number' },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>{label}</label>
                    <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                ))}
                {/* Campo imagen con subida */}
                <div>
                  <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Imagen del Producto</label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input type="file" accept="image/*" onChange={e => subirImagen(e.target.files[0])}
                      style={{ display: 'none' }} id="input-imagen" />
                    <label htmlFor="input-imagen"
                      style={{ background: VERDE, color: 'white', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      {subiendo ? '⏳ Subiendo...' : '📷 Subir foto'}
                    </label>
                    {form.imagen_url && (
                      <img src={form.imagen_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                    )}
                  </div>
                  <input type="text" value={form.imagen_url} onChange={e => setForm({ ...form, imagen_url: e.target.value })}
                    placeholder="O pega una URL"
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '12px', marginTop: '4px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Categoría</label>
                  <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }}>
                    {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={2}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Beneficios</label>
                <textarea value={form.beneficios} onChange={e => setForm({ ...form, beneficios: e.target.value })} rows={2}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button onClick={guardarProducto} disabled={cargando}
                  style={{ background: VERDE, color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                  {cargando ? 'Guardando...' : editando ? 'Actualizar' : 'Crear Producto'}
                </button>
                {editando && (
                  <button onClick={() => { setForm(productoVacio); setEditando(null); }}
                    style={{ background: '#f0f0f0', color: '#333', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            {/* Lista productos */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: VERDE, margin: 0 }}>Productos ({productosFiltrados.length})</h3>
                <input placeholder="🔍 Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  style={{ padding: '7px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', width: '200px' }} />
              </div>
              {cargando ? <p>Cargando...</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: VERDE, color: 'white' }}>
                        {['Nombre', 'Categoría', 'Precio', 'Stock', 'Acciones'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {productosFiltrados.map((p, i) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                          <td style={{ padding: '10px 14px', fontWeight: '500' }}>
                            {p.imagen_url && <img src={p.imagen_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', marginRight: '8px', verticalAlign: 'middle' }} />}
                            {p.nombre}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#666' }}>{p.categoria}</td>
                          <td style={{ padding: '10px 14px', color: VERDE, fontWeight: 'bold' }}>${p.precio?.toLocaleString()}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ background: p.stock > 0 ? '#ecfdf5' : '#fef2f2', color: p.stock > 0 ? VERDE : '#dc2626', padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                              {p.stock}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <button onClick={() => editarProducto(p)}
                              style={{ background: '#f0f7f0', color: VERDE, border: `1px solid ${VERDE}`, padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', marginRight: '6px' }}>
                              ✏️ Editar
                            </button>
                            <button onClick={() => eliminarProducto(p.id, p.nombre)}
                              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #dc2626', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                              🗑 Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {productosFiltrados.length === 0 && <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>No hay productos</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── USUARIOS ── */}
        {seccion === 'usuarios' && (
          <div>
            <h2 style={{ color: VERDE, marginTop: 0 }}>Usuarios Registrados</h2>
            {cargando ? <p>Cargando...</p> : (
              <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: VERDE, color: 'white' }}>
                      {['ID', 'Nombre', 'Email', 'Teléfono', 'Tipo'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((u, i) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '10px 14px', color: '#888' }}>{u.id}</td>
                        <td style={{ padding: '10px 14px', fontWeight: '500' }}>{u.nombre}</td>
                        <td style={{ padding: '10px 14px' }}>{u.email}</td>
                        <td style={{ padding: '10px 14px', color: '#666' }}>{u.telefono || '-'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            background: u.tipo === 'admin' ? '#fef3c7' : u.tipo === 'vendedor' ? '#ecfdf5' : '#eff6ff',
                            color: u.tipo === 'admin' ? '#92400e' : u.tipo === 'vendedor' ? VERDE : '#1d4ed8',
                            padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
                          }}>
                            {u.tipo}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {usuarios.length === 0 && <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>No hay usuarios</p>}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
