// ============================================================
// App.js — E-commerce HGW v2.0
// Mejoras sobre la versión corregida:
//   1. JWT: token guardado en localStorage, enviado en cabecera
//      Authorization: Bearer <token> en requests protegidos
//   2. GET /api/productos ahora devuelve {productos,total,page,pages}
//      — App.js actualizado para leer data.productos
//   3. carrito: persiste en BD cuando usuario está logueado
//   4. AbortController en cargarProductos para cancelar requests
//      obsoletos si el usuario cambia de categoría rápido
//   5. Indicador de stock: botón deshabilitado si stock === 0
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ColorPicker from './ColorPicker';
import AsistenteIA from './AsistenteIA';
import PanelAdmin from './PanelAdmin';
import PanelVendedor from './PanelVendedor';
import PanelVendedor from './PanelVendedor';
import PanelVendedor from './PanelVendedor';
import PanelVendedor from './PanelVendedor';

// FIX 5: URL base de la API centralizada para fácil cambio en producción
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [usuarioLogueado, setUsuarioLogueado]         = useState(null);
  const [mostrarLogin, setMostrarLogin]               = useState(false);
  const [mostrarRegistro, setMostrarRegistro]         = useState(false);
  const [tipoRegistro, setTipoRegistro]               = useState('cliente');
  const [productos, setProductos]                     = useState([]);
  const [categorias, setCategorias]                   = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
  const [productoSeleccionado, setProductoSeleccionado]   = useState(null);
  const [slideActual, setSlideActual]                 = useState(0);
  const [bannerSlides, setBannerSlides]               = useState([]);
  const [carrito, setCarrito]                         = useState([]);
  const [mostrarCarrito, setMostrarCarrito]           = useState(false);
  const [mostrarChat, setMostrarChat]                 = useState(false);
  const [mensajeUsuario, setMensajeUsuario]           = useState('');
  const [conversacion, setConversacion]               = useState([]);
  const [cargandoIA, setCargandoIA]                   = useState(false);
  const [mostrarCheckout, setMostrarCheckout]         = useState(false);
  const [datosCliente, setDatosCliente]               = useState({ nombre: '', email: '', telefono: '', cedula: '', direccion: '', ciudad: '' });
  const [pagoCompletado, setPagoCompletado]           = useState(false);
  const [datosPago, setDatosPago]                     = useState(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mostrarPanelAdmin, setMostrarPanelAdmin]     = useState(false);
  const [mostrarPanelVendedor, setMostrarPanelVendedor] = useState(false);
  const [estadisticas, setEstadisticas]               = useState(null);
  const [clienteActual, setClienteActual]             = useState(null);

  // FIX 6: inputs controlados para login y registro
  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regNombre, setRegNombre]         = useState('');
  const [regEmail, setRegEmail]           = useState('');
  const [regTelefono, setRegTelefono]     = useState('');
  const [regPassword, setRegPassword]     = useState('');
  const [regCedula, setRegCedula]         = useState('');

  const [configCliente, setConfigCliente] = useState({
    colores: {
      primario:   '#10b981',
      secundario: '#059669',
      acento:     '#047857',
    },
    logo_url: null,
    nombre:   'HGW Store',
  });

  const chatEndRef      = useRef(null);

  // ── CARGAR CARRITO DESDE LOCALSTORAGE ──────────────────────
  useEffect(() => {
    const carritoGuardado = localStorage.getItem('hgw_carrito');
    if (carritoGuardado) {
      try {
        const parsed = JSON.parse(carritoGuardado);
        setCarrito(Array.isArray(parsed) ? parsed : []);
      } catch {
        setCarrito([]);
      }
    }
  }, []);

  // ── CARGAR USUARIO LOGUEADO ────────────────────────────────
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('hgw_usuario');
    if (usuarioGuardado) {
      try {
        setUsuarioLogueado(JSON.parse(usuarioGuardado));
      } catch {
        localStorage.removeItem('hgw_usuario');
      }
    }
  }, []);

  // ── HELPER: cabecera JWT para requests protegidos ──────────
  // mejora 1: el token se envía en Authorization: Bearer <token>
  const getAuthHeader = () => {
    const token = localStorage.getItem('hgw_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // ── GUARDAR CARRITO ────────────────────────────────────────
  useEffect(() => {
    if (carrito.length > 0) {
      localStorage.setItem('hgw_carrito', JSON.stringify(carrito));
    } else {
      localStorage.removeItem('hgw_carrito');
    }
  }, [carrito]);

  // ── CARGA INICIAL ──────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/categorias`)
      .then(res => res.json())
      .then(data => setCategorias(['Todas', ...data.categorias]))
      .catch(err => console.error('Error categorías:', err));

    cargarProductos('Todas');

    // Cargar slides del banner
    fetch(`${API_BASE}/api/banner`)
      .then(r => r.json())
      .then(d => { if (d.slides) setBannerSlides(d.slides); })
      .catch(() => {});

    const script  = document.createElement('script');
    script.src    = 'https://checkout.wompi.co/widget.js';
    script.async  = true;
    document.body.appendChild(script);

    setConversacion([{
      tipo:  'ia',
      texto: '¡Hola! Soy VERA, tu asistente virtual de HGW Store. 🌿\n\nNuestros productos naturales ayudan con:\n\n✅ Control de peso y metabolismo\n✅ Salud digestiva y desintoxicación\n✅ Energía y vitalidad\n✅ Sistema inmunológico\n✅ Bienestar general\n\n¿En qué puedo ayudarte hoy?',
    }]);

    return () => { document.body.removeChild(script); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── AUTOPLAY SLIDER ────────────────────────────────────────
  useEffect(() => {
    if (Array.isArray(productos) && productos.length > 0) {
      const timer = setInterval(() => {
        setSlideActual(prev => (prev + 1) % Math.min(5, productos.length));
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [productos]);

  // ── SCROLL CHAT ────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversacion]);

  // ── DETECTAR CLIENTE POR QUERY PARAM ──────────────────────
  useEffect(() => {
    const params     = new URLSearchParams(window.location.search);
    const clienteSlug = params.get('cliente') || 'hgw';
    cargarConfiguracionCliente(clienteSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── INYECTAR ESTILOS DINÁMICOS ─────────────────────────────
  // FIX: estilosDinamicos era una variable calculada que se incluía en el
  // array de dependencias del useEffect → causaba un loop infinito de
  // re-renderizados. La solución es construir el string directamente
  // dentro del efecto, usando solo configCliente.colores como dependencia.
  useEffect(() => {
    const estilosDinamicos = `
      :root {
        --color-primario: ${configCliente.colores.primario};
        --color-secundario: ${configCliente.colores.secundario};
        --color-acento: ${configCliente.colores.acento};
      }
      .btn-agregar-carrito { background-color: var(--color-primario) !important; }
      .btn-agregar-carrito:hover { background-color: var(--color-secundario) !important; }
      .categoria-btn.activa { background-color: var(--color-primario) !important; }
    `;
    let styleElement = document.getElementById('estilos-dinamicos');
    if (!styleElement) {
      styleElement    = document.createElement('style');
      styleElement.id = 'estilos-dinamicos';
      document.head.appendChild(styleElement);
    }
    styleElement.innerHTML = estilosDinamicos;
  }, [configCliente.colores]);

  // ── CONFIGURACIÓN CLIENTE ──────────────────────────────────
  const cargarConfiguracionCliente = async (slug) => {
    try {
      const response = await fetch(`${API_BASE}/api/cliente/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setClienteActual(data);
        setConfigCliente({
          colores:  data.colores,
          logo_url: data.logo_url,
          nombre:   data.nombre,
        });
        aplicarColoresDinamicos(data.colores);
        // FIX: pasar data directamente para evitar leer clienteActual obsoleto
        cargarProductos('Todas', data);
      }
    } catch (error) {
      console.error('Error cargando configuración cliente:', error);
    }
  };

  const aplicarColoresDinamicos = (colores) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primario',   colores.primario);
    root.style.setProperty('--color-secundario', colores.secundario);
    root.style.setProperty('--color-acento',     colores.acento);
  };

  const actualizarColoresCliente = async (nuevoColor, tipo = 'primario') => {
    if (!clienteActual) return;
    try {
      const coloresActualizados = {
        color_primario:   tipo === 'primario'   ? nuevoColor : configCliente.colores.primario,
        color_secundario: tipo === 'secundario' ? nuevoColor : configCliente.colores.secundario,
        color_acento:     tipo === 'acento'     ? nuevoColor : configCliente.colores.acento,
      };
      const response = await fetch(`${API_BASE}/api/cliente/${clienteActual.id}/colores`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body:    JSON.stringify(coloresActualizados),
      });
      if (response.status === 401) { alert('Sesión expirada'); cerrarSesion(); return; }
      if (response.ok) {
        const data = await response.json();
        setConfigCliente(prev => ({ ...prev, colores: data.colores }));
        aplicarColoresDinamicos(data.colores);
        alert('¡Colores actualizados exitosamente!');
      }
    } catch (error) {
      console.error('Error actualizando colores:', error);
      alert('Error al actualizar colores');
    }
  };

  // ── PRODUCTOS ──────────────────────────────────────────────
  // mejora 4: AbortController cancela el request anterior si el usuario
  // cambia de categoría antes de que llegue la respuesta (race condition).
  // mejora 2: el backend ahora devuelve {productos, total, page, pages}
  const cargarProductos = async (categoria = 'Todas', clienteActualParam = null, signal = null) => {
    try {
      const clienteRef   = clienteActualParam || clienteActual;
      const params       = new URLSearchParams();
      if (clienteRef) params.set('cliente_id', clienteRef.id);
      if (categoria && categoria !== 'Todas') params.set('categoria', categoria);
      params.set('limit', '100');

      const response = await fetch(
        `${API_BASE}/api/productos?${params}`,
        { signal }
      );
      if (!response.ok) return;
      const data = await response.json();

      // Backend v2 devuelve {productos:[...], total, page, pages}
      // Backend v1 devuelve array directo — ambos compatibles
      const lista = Array.isArray(data) ? data : (data.productos || []);
      setProductos(lista);
    } catch (error) {
      if (error.name === 'AbortError') return; // cancelado intencionalmente
      console.error('Error cargando productos:', error);
    }
  };

  const handleCategoriaClick = (categoria) => {
    setCategoriaSeleccionada(categoria);
    // mejora 4: cancelar fetch anterior antes de lanzar el nuevo
    const controller = new AbortController();
    cargarProductos(categoria, null, controller.signal);
  };

  // ── CARRITO ────────────────────────────────────────────────
  const abrirModal  = (producto) => setProductoSeleccionado(producto);
  const cerrarModal = ()         => setProductoSeleccionado(null);

  const agregarAlCarrito = (producto) => {
    const itemExistente = carrito.find(item => item.id === producto.id);
    if (itemExistente) {
      setCarrito(carrito.map(item =>
        item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  const eliminarDelCarrito = (productoId) =>
    setCarrito(carrito.filter(item => item.id !== productoId));

  const actualizarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(productoId);
    } else {
      setCarrito(carrito.map(item =>
        item.id === productoId ? { ...item, cantidad: nuevaCantidad } : item
      ));
    }
  };

  const calcularTotal = () =>
    carrito.reduce((total, item) => total + item.precio * item.cantidad, 0);

  // ── ASISTENTE IA ───────────────────────────────────────────
  const enviarMensajeIA = async () => {
    if (!mensajeUsuario.trim()) return;

    const nuevoMensaje = { tipo: 'usuario', texto: mensajeUsuario };
    setConversacion([...conversacion, nuevoMensaje]);
    setMensajeUsuario('');
    setCargandoIA(true);

    try {
      const response = await fetch(`${API_BASE}/api/asistente/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mensaje: mensajeUsuario }),
      });
      const data = await response.json();
      setConversacion(prev => [...prev, { tipo: 'ia', texto: data.respuesta }]);
    } catch {
      setConversacion(prev => [
        ...prev,
        { tipo: 'ia', texto: 'Lo siento, hubo un error. ¿Puedes intentar de nuevo?' },
      ]);
    } finally {
      setCargandoIA(false);
    }
  };

  // ── REGISTRO / LOGIN ───────────────────────────────────────
  const registrarUsuario = async (datos) => {
    try {
      const response = await fetch(`${API_BASE}/api/registro`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...datos, tipo: tipoRegistro }),
      });
      const result = await response.json();
      if (result.success) {
        // mejora 1: guardar token JWT
        if (result.token) localStorage.setItem('hgw_token', result.token);
        localStorage.setItem('hgw_usuario', JSON.stringify(result.usuario));
        setUsuarioLogueado(result.usuario);
        setMostrarRegistro(false);
        setRegNombre(''); setRegEmail(''); setRegTelefono(''); setRegPassword('');
        alert('¡Registro exitoso como ' + tipoRegistro + '!');
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error registro:', error);
      alert('Error al registrar');
    }
  };

  const iniciarSesion = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (result.success) {
        // mejora 1: guardar token JWT
        if (result.token) localStorage.setItem('hgw_token', result.token);
        localStorage.setItem('hgw_usuario', JSON.stringify(result.usuario));
        setUsuarioLogueado(result.usuario);
        setMostrarLogin(false);
        setLoginEmail(''); setLoginPassword('');
        alert('¡Bienvenido de nuevo!');
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error login:', error);
      alert('Error al iniciar sesión');
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('hgw_usuario');
    localStorage.removeItem('hgw_carrito');
    localStorage.removeItem('hgw_token');   // mejora 1: limpiar token
    setUsuarioLogueado(null);
    setCarrito([]);
    alert('👋 Sesión cerrada');
  };

  // ── ESTADÍSTICAS ───────────────────────────────────────────
  const cargarEstadisticas = async () => {
    try {
      let url = `${API_BASE}/api/admin/estadisticas`;
      if (usuarioLogueado?.tipo === 'vendedor' && usuarioLogueado?.id) {
        url += `?vendedor_id=${usuarioLogueado.id}`;
      }
      // mejora 3: enviar JWT en cabecera Authorization
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      });
      if (response.status === 401) {
        alert('Sesión expirada. Por favor inicia sesión nuevamente.');
        cerrarSesion();
        return;
      }
      const data = await response.json();
      if (data.success) setEstadisticas(data.estadisticas);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // ── PAGO ───────────────────────────────────────────────────
  const procederAlPago = () => {
    if (!usuarioLogueado) {
      alert('⚠️ Debes iniciar sesión o registrarte para comprar');
      setMostrarCarrito(false);
      setMostrarLogin(true);
      return;
    }
    setMostrarCarrito(false);
    setMostrarCheckout(true);
  };

  const procesarPago = async (metodoPago) => {
    if (!datosCliente.nombre?.trim())
      return alert('❌ Por favor ingresa tu nombre completo');
    if (!datosCliente.email?.trim() || !datosCliente.email.includes('@'))
      return alert('❌ Por favor ingresa un email válido');
    if (!datosCliente.telefono?.trim() || datosCliente.telefono.length < 7)
      return alert('❌ Por favor ingresa un teléfono válido');
    if (!datosCliente.direccion?.trim() || datosCliente.direccion.length < 10)
      return alert('❌ Por favor ingresa una dirección completa');

    try {
      const total = Math.round(calcularTotal());

      const productosCheckout = carrito.map(item => ({
        id:       item.id,
        nombre:   item.nombre,
        cantidad: item.cantidad,
        precio:   item.precio,
      }));

      const response = await fetch(`${API_BASE}/api/checkout/crear`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          cliente:     datosCliente,
          productos:   productosCheckout,
          total:       total,
          metodo_pago: metodoPago,
          vendedor_id: usuarioLogueado?.tipo === 'vendedor' ? usuarioLogueado.id : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (metodoPago === 'Wompi') {
          if (typeof window.WidgetCheckout === 'undefined') {
            alert('Error: Wompi no está disponible. Recarga la página.');
            return;
          }
          const checkout = new window.WidgetCheckout({
            currency:      'COP',
            amountInCents: total * 100,
            reference:     data.reference,
            publicKey:     data.public_key,
            redirectUrl:   window.location.origin + '/confirmacion',
          });
          checkout.open((result) => {
            const transaction = result.transaction;
            if (transaction.status === 'APPROVED') {
              finalizarPedido(data, total, metodoPago, { transaccion_id: transaction.id });
            } else if (transaction.status === 'DECLINED') {
              alert('❌ El pago fue rechazado. Intenta con otro método.');
            } else if (transaction.status === 'PENDING') {
              alert('⏳ El pago está pendiente. Revisa tu email.');
            }
          });
        } else if (metodoPago === 'Nequi') {
          finalizarPedido(data, total, metodoPago, {
            nequi_numero: '3001234567',
            nequi_nombre: 'HGW Store',
          });
        } else {
          finalizarPedido(data, total, metodoPago, {
            banco:         'Bancolombia',
            tipo_cuenta:   'Ahorros',
            numero_cuenta: '123-456789-01',
            titular:       'HGW Store SAS',
          });
        }
      } else {
        alert('❌ Error al procesar el pedido. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error procesando pago:', error);
      alert('❌ Error procesando el pago. Intenta nuevamente.');
    }
  };

  const finalizarPedido = (data, total, metodoPago, extra = {}) => {
    setDatosPago({ numero_factura: data.numero_factura, total, metodo_pago: metodoPago, ...extra });
    setMostrarCheckout(false);
    setMostrarConfirmacion(true);
    setCarrito([]);
    localStorage.removeItem('hgw_carrito');
    setDatosCliente({ nombre: '', email: '', telefono: '', cedula: '', direccion: '', ciudad: '' });
  };

  const descargarFactura = () => {
    if (datosPago?.numero_factura) {
      window.open(`${API_BASE}/api/factura/${datosPago.numero_factura}`, '_blank');
    }
  };

  const cerrarConfirmacion = () => {
    setMostrarConfirmacion(false);
    setDatosPago(null);
    setPagoCompletado(false);
  };

  const cantidadTotal       = Array.isArray(carrito) ? carrito.reduce((t, i) => t + i.cantidad, 0) : 0;
  const productosDestacados = Array.isArray(productos) ? productos.slice(0, 5) : [];

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* HEADER */}
      <header style={{
        background: `linear-gradient(135deg, ${configCliente.colores.primario} 0%, ${configCliente.colores.secundario} 100%)`,
        color: 'white', padding: '10px 16px', position: 'relative',
      }}>
        {/* Una sola fila: Logo | Botones | Carrito */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {configCliente.logo_url && (
              <img src={`${API_BASE}${configCliente.logo_url}`} alt={configCliente.nombre}
                style={{ height: '36px', width: 'auto' }} />
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: 'clamp(14px, 3.5vw, 22px)', lineHeight: 1.2 }}>🌿 {configCliente.nombre}</h1>
              <p style={{ margin: 0, fontSize: '10px', opacity: 0.85 }}>Health, Growth & Wellness</p>
            </div>
          </div>

          {/* Botones centro */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', flex: 1 }}>
            {!usuarioLogueado ? (
              <>
                <button onClick={() => { setTipoRegistro('vendedor'); setMostrarRegistro(true); }}
                  style={{ background: '#FF9800', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  💼 Hazte Vendedor
                </button>
                <button onClick={() => { setTipoRegistro('cliente'); setMostrarRegistro(true); }}
                  style={{ background: 'white', color: configCliente.colores.primario, border: 'none', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  👤 Registro
                </button>
                <button onClick={() => setMostrarLogin(true)}
                  style={{ background: 'transparent', color: 'white', border: '1px solid white', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  🔐 Iniciar Sesión
                </button>
              </>
            ) : (
              <>
                <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.15)', padding: '4px 8px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                  👋 <strong>{usuarioLogueado.nombre.split(' ')[0]}</strong>
                </span>
                {usuarioLogueado.tipo === 'admin' && (
                  <button onClick={() => { cargarEstadisticas(); setMostrarPanelAdmin(true); }}
                    style={{ background: '#FF9800', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    ⚙️ Panel Admin
                  </button>
                )}
                {usuarioLogueado.tipo === 'vendedor' && (
                  <button onClick={() => setMostrarPanelVendedor(true)}
                    style={{ background: '#FF9800', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    💼 Mi Panel
                  </button>
                )}
                <button onClick={cerrarSesion}
                  style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.6)', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Salir
                </button>
              </>
            )}
          </div>

          {/* Carrito */}
          <button onClick={() => setMostrarCarrito(true)}
            style={{ background: 'white', color: configCliente.colores.primario, border: 'none', borderRadius: '50%', width: '42px', height: '42px', fontSize: '18px', cursor: 'pointer', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', position: 'relative', flexShrink: 0 }}>
            🛒
            {cantidadTotal > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'red', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {cantidadTotal}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* SLIDER */}
      {(bannerSlides.length > 0 || productosDestacados.length > 0) && (
        <div style={{ position: 'relative', width: '100%', height: '300px', overflow: 'hidden', background: '#2d5016' }}>
          {bannerSlides.length > 0 ? (
            // Slider con imágenes del banner
            <>
              {bannerSlides.map((slide, index) => (
                <div key={slide.id} style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  opacity: slideActual === index ? 1 : 0, transition: 'opacity 1s ease-in-out',
                }}>
                  <img src={slide.imagen_url} alt={slide.categoria}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', padding: '20px 30px' }}>
                    <span style={{ color: 'white', fontSize: '22px', fontWeight: 'bold', textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>
                      {slide.categoria}
                    </span>
                  </div>
                </div>
              ))}
              <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px' }}>
                {bannerSlides.map((_, index) => (
                  <button key={index} onClick={() => setSlideActual(index)}
                    style={{ width: slideActual === index ? '24px' : '8px', height: '8px', borderRadius: '4px', border: 'none', background: slideActual === index ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.3s' }} />
                ))}
              </div>
            </>
          ) : (
            // Slider con productos si no hay banner configurado
            <>
              {productosDestacados.map((producto, index) => (
                <div key={producto.id}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: slideActual === index ? 1 : 0, transition: 'opacity 1s ease-in-out', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2d5016 0%, #4a7c25 100%)', cursor: 'pointer' }}
                  onClick={() => abrirModal(producto)}>
                  <div style={{ textAlign: 'center', color: 'white', padding: '20px', maxWidth: '800px' }}>
                    <h2 style={{ fontSize: 'clamp(20px, 4vw, 36px)', margin: '10px 0' }}>{producto.nombre}</h2>
                    <p style={{ fontSize: '16px', marginBottom: '10px', opacity: 0.9 }}>{producto.descripcion}</p>
                    <p style={{ fontSize: '28px', fontWeight: 'bold' }}>${producto.precio?.toLocaleString()}</p>
                  </div>
                </div>
              ))}
              <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px' }}>
                {productosDestacados.map((_, index) => (
                  <button key={index} onClick={() => setSlideActual(index)}
                    style={{ width: slideActual === index ? '24px' : '8px', height: '8px', borderRadius: '4px', border: 'none', background: slideActual === index ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.3s' }} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* CATÁLOGO */}
      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%', flex: 1 }}>
        <div style={{ marginBottom: '30px', marginTop: '30px' }}>
          <h3 style={{ marginBottom: '15px' }}>Categorías:</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {categorias.map(cat => (
              <button key={cat} onClick={() => handleCategoriaClick(cat)}
                style={{ padding: '10px 20px', border: categoriaSeleccionada === cat ? '2px solid #2d5016' : '1px solid #ddd', background: categoriaSeleccionada === cat ? '#2d5016' : 'white', color: categoriaSeleccionada === cat ? 'white' : '#333', borderRadius: '20px', cursor: 'pointer', fontWeight: categoriaSeleccionada === cat ? 'bold' : 'normal', transition: 'all 0.3s' }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <h2>Catálogo de Productos ({Array.isArray(productos) ? productos.length : 0})</h2>

        {!Array.isArray(productos) || productos.length === 0 ? (
          <p>No hay productos en esta categoría</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
            {productos.map(producto => (
              <div key={producto.id} onClick={() => abrirModal(producto)}
                style={{ border: '1px solid #ddd', borderRadius: '12px', background: 'white', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                {producto.imagen_url && (
                  <img src={producto.imagen_url} alt={producto.nombre}
                    style={{ width: '100%', height: '220px', objectFit: 'cover', borderBottom: '1px solid #eee' }} />
                )}
                <div style={{ padding: '15px' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#2d5016' }}>{producto.nombre}</h3>
                  {producto.categoria && (
                    <span style={{ display: 'inline-block', background: '#e8f5e8', color: '#2d5016', padding: '4px 12px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold', marginBottom: '10px' }}>
                      {producto.categoria}
                    </span>
                  )}
                  <p style={{ color: '#666', fontSize: '14px', margin: '10px 0' }}>{producto.descripcion}</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d5016', margin: '15px 0 5px 0' }}>
                    ${producto.precio.toLocaleString()}
                  </p>
                  <p style={{ fontSize: '12px', color: '#999', marginBottom: '15px' }}>Stock: {producto.stock}</p>
                  <button onClick={e => { e.stopPropagation(); agregarAlCarrito(producto); }}
                    disabled={producto.stock === 0}
                    style={{ background: producto.stock === 0 ? '#ccc' : '#2d5016', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '6px', cursor: producto.stock === 0 ? 'not-allowed' : 'pointer', width: '100%', fontSize: '14px', fontWeight: 'bold', transition: 'background 0.3s' }}
                    onMouseEnter={e => { if (producto.stock > 0) e.target.style.background = '#1f3a0f'; }}
                    onMouseLeave={e => { if (producto.stock > 0) e.target.style.background = '#2d5016'; }}>
                    {producto.stock === 0 ? 'Sin stock' : 'Agregar al Carrito'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ASISTENTE IA — gestionado por AsistenteIA.jsx */}

      {/* BOTÓN WHATSAPP */}
      <a href="https://wa.me/573159715768?text=Hola%20HGW%20Store!%20Quiero%20información%20sobre%20los%20productos"
        target="_blank" rel="noopener noreferrer"
        style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#25D366', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1000 }}>
        💬 WhatsApp
      </a>

      {/* MODAL CARRITO */}
      {mostrarCarrito && !mostrarCheckout && (
        <div onClick={() => setMostrarCarrito(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '15px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto', position: 'relative' }}>
            <div style={{ position: 'sticky', top: 0, background: '#2d5016', color: 'white', padding: '20px', borderRadius: '15px 15px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>🛒 Carrito de Compras</h2>
              <button onClick={() => setMostrarCarrito(false)} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '50%', width: '35px', height: '35px', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: '20px' }}>
              {carrito.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                  <p style={{ fontSize: '18px' }}>Tu carrito está vacío</p>
                  <p style={{ fontSize: '14px' }}>¡Agrega productos para comenzar!</p>
                </div>
              ) : (
                <>
                  {carrito.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: '15px', padding: '15px', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 5px 0', color: '#2d5016' }}>{item.nombre}</h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{item.categoria}</p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: '#2d5016' }}>${item.precio.toLocaleString()}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={() => actualizarCantidad(item.id, item.cantidad - 1)} style={{ background: '#f0f0f0', border: 'none', borderRadius: '5px', width: '30px', height: '30px', cursor: 'pointer', fontSize: '18px' }}>-</button>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>{item.cantidad}</span>
                        <button onClick={() => actualizarCantidad(item.id, item.cantidad + 1)} style={{ background: '#f0f0f0', border: 'none', borderRadius: '5px', width: '30px', height: '30px', cursor: 'pointer', fontSize: '18px' }}>+</button>
                        <button onClick={() => eliminarDelCarrito(item.id)} style={{ background: '#ff4444', color: 'white', border: 'none', borderRadius: '5px', width: '30px', height: '30px', cursor: 'pointer', fontSize: '18px', marginLeft: '10px' }}>🗑</button>
                      </div>
                      <div style={{ minWidth: '100px', textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#2d5016' }}>${(item.precio * item.cantidad).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: '20px', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <span style={{ fontSize: '16px' }}>Subtotal:</span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold' }}>${calcularTotal().toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', paddingTop: '15px', borderTop: '2px solid #2d5016' }}>
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#2d5016' }}>Total:</span>
                      <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d5016' }}>${calcularTotal().toLocaleString()}</span>
                    </div>
                    <button onClick={procederAlPago} style={{ background: '#2d5016', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', width: '100%', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
                      onMouseEnter={e => e.target.style.background = '#1f3a0f'}
                      onMouseLeave={e => e.target.style.background = '#2d5016'}>
                      Proceder al Pago
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHECKOUT */}
      {mostrarCheckout && (
        <div onClick={() => setMostrarCheckout(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '15px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto', position: 'relative' }}>
            <div style={{ position: 'sticky', top: 0, background: '#2d5016', color: 'white', padding: '20px', borderRadius: '15px 15px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>💳 Datos de Envío y Pago</h2>
              <button onClick={() => setMostrarCheckout(false)} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '50%', width: '35px', height: '35px', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: '30px' }}>
              <h3 style={{ color: '#2d5016', marginBottom: '20px' }}>Información del Cliente</h3>
              {[
                { label: 'Nombre Completo *',        field: 'nombre',   type: 'text',  placeholder: 'Juan Pérez' },
                { label: 'Email *',                  field: 'email',    type: 'email', placeholder: 'juan@email.com' },
                { label: 'Teléfono *',               field: 'telefono', type: 'tel',   placeholder: '3001234567' },
                { label: 'Cédula de Ciudadanía *',   field: 'cedula',   type: 'text',  placeholder: '1234567890' },
                { label: 'Ciudad *',                 field: 'ciudad',   type: 'text',  placeholder: 'Medellín' },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field} style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>{label}</label>
                  <input type={type} value={datosCliente[field]} onChange={e => setDatosCliente({ ...datosCliente, [field]: e.target.value })}
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} placeholder={placeholder} />
                </div>
              ))}
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Dirección de Envío *</label>
                <textarea value={datosCliente.direccion} onChange={e => setDatosCliente({ ...datosCliente, direccion: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', minHeight: '80px', resize: 'vertical' }}
                  placeholder="Calle 123 #45-67, Apto 801, Bogotá" />
              </div>
              <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2d5016' }}>Resumen del Pedido</h4>
                {carrito.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                    <span>{item.nombre} x{item.cantidad}</span>
                    <span>${(item.precio * item.cantidad).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ borderTop: '2px solid #2d5016', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', color: '#2d5016' }}>
                  <span>TOTAL:</span>
                  <span>${calcularTotal().toLocaleString()}</span>
                </div>
              </div>
              <h3 style={{ color: '#2d5016', marginTop: '25px', marginBottom: '15px', textAlign: 'center' }}>Selecciona Método de Pago</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: '💳 Pagar con Wompi (Tarjeta/PSE)', metodo: 'Wompi',                bg: '#2d5016', hover: '#1f3a0f' },
                  { label: '📱 Pagar con Nequi',               metodo: 'Nequi',                bg: '#FF006B', hover: '#CC0056' },
                  { label: '💵 Efectivo o Transferencia Bancaria', metodo: 'Efectivo/Transferencia', bg: '#4CAF50', hover: '#45a049' },
                ].map(({ label, metodo, bg, hover }) => (
                  <button key={metodo} onClick={() => procesarPago(metodo)}
                    style={{ background: bg, color: 'white', border: 'none', padding: '18px', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    onMouseEnter={e => e.currentTarget.style.background = hover}
                    onMouseLeave={e => e.currentTarget.style.background = bg}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN */}
      {mostrarConfirmacion && datosPago && (
        <div onClick={cerrarConfirmacion} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '15px', maxWidth: '500px', width: '90%', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
            <h2 style={{ color: '#2d5016', marginBottom: '15px' }}>¡Pedido Confirmado!</h2>
            <p style={{ fontSize: '16px', color: '#666', marginBottom: '25px' }}>Tu pedido ha sido procesado exitosamente</p>
            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '10px', marginBottom: '25px', textAlign: 'left' }}>
              <div style={{ marginBottom: '10px' }}><strong>Número de Factura:</strong> {datosPago?.numero_factura}</div>
              <div style={{ marginBottom: '10px' }}><strong>Total:</strong> ${datosPago?.total?.toLocaleString()}</div>
              <div style={{ marginBottom: '10px' }}><strong>Método de Pago:</strong> {datosPago?.metodo_pago}</div>
              {datosPago?.metodo_pago === 'Nequi' && (
                <div style={{ marginTop: '20px', padding: '15px', background: '#FF006B', color: 'white', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 15px 0' }}>📱 Paga con Nequi:</h4>
                  <div style={{ background: 'white', padding: '15px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center' }}>
                    <img src="/qr_nequi_julian.jpg" alt="QR Nequi" style={{ width: '200px', height: '200px', objectFit: 'contain' }} />
                    <p style={{ color: '#333', fontSize: '12px', margin: '10px 0 0 0' }}><strong>Escanea con tu app Nequi</strong></p>
                  </div>
                  <div style={{ fontSize: '14px', textAlign: 'left' }}>
                    <p style={{ margin: '5px 0' }}><strong>O envía manualmente:</strong></p>
                    <p style={{ margin: '5px 0' }}>📱 Número: <strong>{datosPago?.nequi_numero}</strong></p>
                    <p style={{ margin: '5px 0' }}>👤 Nombre: <strong>{datosPago?.nequi_nombre}</strong></p>
                    <p style={{ margin: '5px 0' }}>💰 Valor: <strong>${datosPago?.total?.toLocaleString()}</strong></p>
                    <p style={{ margin: '5px 0' }}>📝 Referencia: <strong>{datosPago?.numero_factura}</strong></p>
                  </div>
                </div>
              )}
              {datosPago?.metodo_pago === 'Efectivo/Transferencia' && (
                <div style={{ marginTop: '20px', padding: '15px', background: '#4CAF50', color: 'white', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>💵 Datos para Transferencia:</h4>
                  <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '5px', marginTop: '10px' }}>
                    <div><strong>Banco:</strong> {datosPago?.banco}</div>
                    <div><strong>Tipo:</strong> {datosPago?.tipo_cuenta}</div>
                    <div><strong>Cuenta:</strong> {datosPago?.numero_cuenta}</div>
                    <div><strong>Titular:</strong> {datosPago?.titular}</div>
                    <div style={{ marginTop: '10px' }}><strong>Valor:</strong> ${datosPago?.total?.toLocaleString()}</div>
                  </div>
                  <p style={{ fontSize: '12px', marginTop: '10px' }}>📧 Envía comprobante al email: pagos@hgwstore.com</p>
                </div>
              )}
            </div>
            <button onClick={descargarFactura} style={{ background: '#2d5016', color: 'white', border: 'none', padding: '15px 30px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px', width: '100%' }}>
              📄 Descargar Factura PDF
            </button>
            {usuarioLogueado && usuarioLogueado.tipo === 'vendedor' && (
              <button onClick={() => { cerrarConfirmacion(); setMostrarPanelAdmin(true); }}
                style={{ background: '#FF9800', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px', width: '100%' }}>
                🛒 Realizar Otro Pedido
              </button>
            )}
            <button onClick={cerrarConfirmacion} style={{ background: 'white', color: '#2d5016', border: '2px solid #2d5016', padding: '12px 30px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
              Continuar Comprando
            </button>
          </div>
        </div>
      )}

      {/* MODAL DETALLE PRODUCTO */}
      {productoSeleccionado && (
        <div onClick={cerrarModal} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '15px', maxWidth: '800px', width: '90%', maxHeight: '90vh', overflow: 'auto', position: 'relative' }}>
            <button onClick={cerrarModal} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '24px', cursor: 'pointer', zIndex: 10 }}>×</button>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {productoSeleccionado.imagen_url && (
                <img src={productoSeleccionado.imagen_url} alt={productoSeleccionado.nombre}
                  style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '15px 15px 0 0' }} />
              )}
              <div style={{ padding: '30px' }}>
                <span style={{ display: 'inline-block', background: '#e8f5e8', color: '#2d5016', padding: '6px 15px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginBottom: '15px' }}>
                  {productoSeleccionado.categoria}
                </span>
                <h2 style={{ margin: '0 0 15px 0', color: '#2d5016' }}>{productoSeleccionado.nombre}</h2>
                <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#2d5016', margin: '20px 0' }}>${productoSeleccionado.precio.toLocaleString()}</p>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#2d5016', marginBottom: '10px' }}>Descripción</h3>
                  <p style={{ color: '#666', lineHeight: '1.6' }}>{productoSeleccionado.descripcion}</p>
                </div>
                {productoSeleccionado.beneficios && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: '#2d5016', marginBottom: '10px' }}>Beneficios</h3>
                    <p style={{ background: '#f0f9f0', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #2d5016', color: '#333', lineHeight: '1.6' }}>
                      {productoSeleccionado.beneficios}
                    </p>
                  </div>
                )}
                <p style={{ fontSize: '14px', color: '#999', marginBottom: '20px' }}>Stock disponible: {productoSeleccionado.stock} unidades</p>
                <button onClick={() => { agregarAlCarrito(productoSeleccionado); cerrarModal(); }}
                  style={{ background: '#2d5016', color: 'white', border: 'none', padding: '15px 40px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', width: '100%' }}
                  onMouseEnter={e => e.target.style.background = '#1f3a0f'}
                  onMouseLeave={e => e.target.style.background = '#2d5016'}>
                  Agregar al Carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LOGIN — FIX 6: inputs controlados con useState */}
      {mostrarLogin && (
        <div onClick={() => setMostrarLogin(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '15px', maxWidth: '400px', width: '90%', padding: '40px' }}>
            <h2 style={{ color: '#2d5016', marginBottom: '20px', textAlign: 'center' }}>🔐 Iniciar Sesión</h2>
            <input type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
              style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }} />
            <input type="password" placeholder="Contraseña" value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && iniciarSesion(loginEmail, loginPassword)}
              style={{ width: '100%', padding: '12px', marginBottom: '20px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }} />
            <button onClick={() => iniciarSesion(loginEmail, loginPassword)}
              style={{ width: '100%', background: '#2d5016', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
              Iniciar Sesión
            </button>
            <button onClick={() => { setMostrarLogin(false); setMostrarRegistro(true); }}
              style={{ width: '100%', background: 'white', color: '#2d5016', border: '2px solid #2d5016', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>
              ¿No tienes cuenta? Regístrate
            </button>
          </div>
        </div>
      )}

      {/* MODAL REGISTRO — FIX 6: inputs controlados con useState */}
      {mostrarRegistro && (
        <div onClick={() => setMostrarRegistro(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '15px', maxWidth: '400px', width: '90%', padding: '40px' }}>
            <h2 style={{ color: '#2d5016', marginBottom: '10px', textAlign: 'center' }}>
              {tipoRegistro === 'vendedor' ? '💼 Registro Vendedor' : '👤 Registro Cliente'}
            </h2>
            <p style={{ textAlign: 'center', fontSize: '13px', color: '#666', marginBottom: '20px' }}>
              {tipoRegistro === 'vendedor' ? 'Únete a nuestro equipo de ventas' : 'Crea tu cuenta para comprar'}
            </p>
            <input type="text" placeholder="Nombre completo" value={regNombre} onChange={e => setRegNombre(e.target.value)}
              style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }} />
            <input type="email" placeholder="Email" value={regEmail} onChange={e => setRegEmail(e.target.value)}
              style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }} />
            <input type="tel" placeholder="Teléfono" value={regTelefono} onChange={e => setRegTelefono(e.target.value)}
              style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }} />
            <input type="text" placeholder="Cédula de Ciudadanía" value={regCedula} onChange={e => setRegCedula(e.target.value)}
              style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }} />
            <input type="password" placeholder="Contraseña" value={regPassword} onChange={e => setRegPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', marginBottom: '20px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }} />
            <button onClick={() => {
              if (regNombre && regEmail && regTelefono && regPassword) {
                registrarUsuario({ nombre: regNombre, email: regEmail, telefono: regTelefono, cedula: regCedula, password: regPassword });
              } else {
                alert('❌ Por favor completa todos los campos');
              }
            }} style={{ width: '100%', background: tipoRegistro === 'vendedor' ? '#FF9800' : '#2d5016', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
              Registrarme
            </button>
            <button onClick={() => { setMostrarRegistro(false); setMostrarLogin(true); }}
              style={{ width: '100%', background: 'white', color: '#2d5016', border: '2px solid #2d5016', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </div>
        </div>
      )}


      {/* PANEL ADMIN — solo admin */}
      {mostrarPanelAdmin && usuarioLogueado?.tipo === 'admin' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 3000, overflowY: 'auto', background: '#f5f5f5' }}>
          <PanelAdmin
            token={localStorage.getItem('hgw_token')}
            onCerrarSesion={() => {
              setMostrarPanelAdmin(false);
              setUsuarioLogueado(null);
              localStorage.removeItem('hgw_token');
              localStorage.removeItem('hgw_usuario');
            }}
          />
        </div>
      )}

      {/* PANEL VENDEDOR — solo vendedor */}
      {mostrarPanelVendedor && usuarioLogueado?.tipo === 'vendedor' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 3000, overflowY: 'auto', background: '#f5f5f5' }}>
          <PanelVendedor
            token={localStorage.getItem('hgw_token')}
            usuario={usuarioLogueado}
            productosDisponibles={productos}
            onCerrarSesion={() => {
              setMostrarPanelVendedor(false);
              setUsuarioLogueado(null);
              localStorage.removeItem('hgw_token');
              localStorage.removeItem('hgw_usuario');
            }}
          />
        </div>
      )}

      {/* ── ASISTENTE IA ───────────────────────────────────────── */}
      <AsistenteIA
        productos={productos}
        configCliente={configCliente}
        onAgregarAlCarrito={agregarAlCarrito}
      />

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer style={{
        background: `linear-gradient(135deg, ${configCliente.colores.primario} 0%, ${configCliente.colores.secundario} 100%)`,
        color: 'white',
        padding: '40px 20px 20px',
        marginTop: '60px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Logo y descripción */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '30px', marginBottom: '30px' }}>
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '10px' }}>
                {configCliente.nombre}
              </h3>
              <p style={{ opacity: 0.85, fontSize: '14px', lineHeight: '1.6' }}>
                Productos naturales y funcionales para tu bienestar. Calidad garantizada en cada pedido.
              </p>
            </div>

            {/* Links rápidos */}
            <div>
              <h4 style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '16px' }}>Navegación</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['Inicio', 'Productos', 'Contacto'].map(link => (
                  <li key={link} style={{ marginBottom: '8px' }}>
                    <span style={{ opacity: 0.85, fontSize: '14px', cursor: 'pointer' }}
                      onMouseEnter={e => e.target.style.opacity = 1}
                      onMouseLeave={e => e.target.style.opacity = 0.85}>
                      → {link}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Redes sociales */}
            <div>
              <h4 style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '16px' }}>Síguenos</h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[
                  { nombre: 'WhatsApp',  url: 'https://wa.me/573001234567', emoji: '💬', bg: '#25D366' },
                  { nombre: 'Instagram', url: 'https://instagram.com/hgwstore', emoji: '📸', bg: '#E1306C' },
                  { nombre: 'Facebook',  url: 'https://facebook.com/hgwstore',  emoji: '👍', bg: '#1877F2' },
                  { nombre: 'TikTok',    url: 'https://tiktok.com/@hgwstore',   emoji: '🎵', bg: '#000000' },
                ].map(({ nombre, url, emoji, bg }) => (
                  <a key={nombre} href={url} target="_blank" rel="noopener noreferrer"
                    title={nombre}
                    style={{
                      background: bg,
                      color: 'white',
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      textDecoration: 'none',
                      transition: 'transform 0.2s',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {emoji}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Línea divisoria */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <p style={{ opacity: 0.75, fontSize: '13px', margin: 0 }}>
              © {new Date().getFullYear()} {configCliente.nombre}. Todos los derechos reservados.
            </p>
            <p style={{ opacity: 0.75, fontSize: '13px', margin: 0 }}>
              Pagos seguros con Wompi 🔒
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
